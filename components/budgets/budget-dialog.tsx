"use client"

import { useState, useEffect } from "react"
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
import type { Budget, Category, Account } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget: Budget | null
  categories: Category[]
  accounts: Account[]
  userId: string
  onSaved: (budget: Budget) => void
}

export function BudgetDialog({ open, onOpenChange, budget, categories, accounts, userId, onSaved }: BudgetDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense")
  const [amount, setAmount] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [accountId, setAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("")

  const isEditing = !!budget

  useEffect(() => {
    if (budget) {
      setName(budget.name)
      setType((budget as Budget & { type?: "income" | "expense" | "transfer" }).type || "expense")
      setAmount(String(budget.amount))
      setStartDate(new Date(budget.start_date))
      setEndDate(new Date(budget.end_date))
      setAccountId((budget as Budget & { account_id?: string }).account_id || "")
      setCategoryId((budget as Budget & { category_id?: string }).category_id || "")
    } else {
      setName("")
      setType("expense")
      setAmount("")
      setStartDate(new Date())
      setEndDate(new Date())
      setAccountId("")
      setCategoryId("")
    }
  }, [budget, open])

  // Filter categories based on type
  const filteredCategories = categories.filter((cat) => {
    if (type === "transfer") return true
    return cat.type === type
  })

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a budget name")
      return
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!accountId) {
      toast.error("Please select an account")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const budgetData = {
      user_id: userId,
      name: name.trim(),
      type,
      amount: Number(amount),
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      account_id: accountId,
      category_id: categoryId || null,
      period: "custom" as const,
      rollover: false,
    }

    try {
      let savedBudget: Budget

      if (isEditing && budget) {
        const { data, error } = await supabase
          .from("budgets")
          .update(budgetData)
          .eq("id", budget.id)
          .eq("user_id", userId)
          .select()
          .single()

        if (error) throw error
        savedBudget = data
      } else {
        const { data, error } = await supabase.from("budgets").insert(budgetData).select().single()

        if (error) throw error
        savedBudget = data

        // Create a transaction for this budget
        const transactionData = {
          user_id: userId,
          account_id: accountId,
          category_id: categoryId || null,
          amount: Number(amount),
          type,
          description: name.trim(),
          date: format(startDate, "yyyy-MM-dd"),
        }

        const { error: transactionError } = await supabase.from("transactions").insert(transactionData)

        if (transactionError) {
          console.error("Failed to create transaction:", transactionError)
        }
      }

      toast.success(isEditing ? "Budget updated" : "Budget created")
      onSaved(savedBudget)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error(isEditing ? "Failed to update budget" : "Failed to create budget")
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Budget" : "Create Budget"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your budget details." : "Set up a new budget entry."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Budget Name</Label>
            <Input
              id="name"
              placeholder="e.g., Monthly Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(value: "income" | "expense" | "transfer") => setType(value)}>
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
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={(date) => date && setEndDate(date)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
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
          </div>

          <div className="space-y-2">
            <Label>Category (Optional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
