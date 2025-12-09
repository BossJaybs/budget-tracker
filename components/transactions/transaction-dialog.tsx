"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Transaction, Account, Category } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const transactionSchema = z.object({
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  type: z.enum(["income", "expense", "transfer"]),
  account_id: z.string().min(1, "Account is required"),
  category_id: z.string().optional(),
  date: z.date(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  accounts: Account[]
  categories: Category[]
  userId: string
  onSaved: (transaction: Transaction) => void
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  userId,
  onSaved,
}: TransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!transaction

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: "",
      type: "expense",
      account_id: accounts[0]?.id || "",
      category_id: "",
      date: new Date(),
    },
  })

  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description || "",
        amount: String(transaction.amount),
        type: transaction.type,
        account_id: transaction.account_id,
        category_id: transaction.category_id || "",
        date: new Date(transaction.date),
      })
    } else {
      form.reset({
        description: "",
        amount: "",
        type: "expense",
        account_id: accounts[0]?.id || "",
        category_id: "",
        date: new Date(),
      })
    }
  }, [transaction, accounts, form])

  const selectedType = form.watch("type")
  const filteredCategories = categories.filter(
    (cat) =>
      (selectedType === "income" && cat.type === "income") || (selectedType === "expense" && cat.type === "expense"),
  )

  const onSubmit = async (data: TransactionFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    const transactionData = {
      user_id: userId,
      description: data.description || null,
      amount: Number.parseFloat(data.amount),
      type: data.type,
      account_id: data.account_id,
      category_id: data.category_id || null,
      date: format(data.date, "yyyy-MM-dd"),
    }

    let result
    if (isEditing && transaction) {
      // For editing, calculate the difference and update account balance
      const oldAmount = transaction.amount
      const newAmount = Number.parseFloat(data.amount)
      const difference = newAmount - oldAmount

      // Update account balance based on transaction type
      if (data.type === "income") {
        await supabase.rpc("increment_account_balance", {
          account_id: data.account_id,
          amount: difference,
        })
      } else if (data.type === "expense") {
        await supabase.rpc("increment_account_balance", {
          account_id: data.account_id,
          amount: -difference,
        })
      }

      result = await supabase
        .from("transactions")
        .update(transactionData)
        .eq("id", transaction.id)
        .eq("user_id", userId)
        .select("*, account:accounts(*), category:categories(*)")
        .single()
    } else {
      // For new transactions, update account balance
      if (data.type === "income") {
        await supabase
          .from("accounts")
          .update({ balance: supabase.sql`balance + ${Number.parseFloat(data.amount)}` })
          .eq("id", data.account_id)
          .eq("user_id", userId)
      } else if (data.type === "expense") {
        await supabase
          .from("accounts")
          .update({ balance: supabase.sql`balance - ${Number.parseFloat(data.amount)}` })
          .eq("id", data.account_id)
          .eq("user_id", userId)
      }

      result = await supabase
        .from("transactions")
        .insert(transactionData)
        .select("*, account:accounts(*), category:categories(*)")
        .single()
    }

    if (result.error) {
      toast.error(isEditing ? "Failed to update transaction" : "Failed to create transaction")
    } else {
      toast.success(isEditing ? "Transaction updated" : "Transaction created")
      onSaved(result.data)
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the transaction details below." : "Enter the details for your new transaction."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value: "income" | "expense" | "transfer") => form.setValue("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" {...form.register("amount")} />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="What was this for?" {...form.register("description")} />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("date") && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("date") ? format(form.watch("date"), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("date")}
                  onSelect={(date) => date && form.setValue("date", date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select value={form.watch("account_id")} onValueChange={(value) => form.setValue("account_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.account_id && (
              <p className="text-sm text-destructive">{form.formState.errors.account_id.message}</p>
            )}
          </div>

          {selectedType !== "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch("category_id") || ""}
                onValueChange={(value) => form.setValue("category_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
