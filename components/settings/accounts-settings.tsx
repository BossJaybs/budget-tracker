"use client"

import { useState } from "react"
import type { Account } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, CreditCard, Wallet, PiggyBank, Banknote, TrendingUp } from "lucide-react"

interface AccountsSettingsProps {
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
  userId: string
}

const accountTypes = [
  { value: "checking", label: "Checking", icon: Banknote },
  { value: "savings", label: "Savings", icon: PiggyBank },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "investment", label: "Investment", icon: TrendingUp },
]

const accountColors = ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#6b7280"]

export function AccountsSettings({ accounts, setAccounts, userId }: AccountsSettingsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<Account["type"]>("checking")
  const [balance, setBalance] = useState("")
  const [color, setColor] = useState(accountColors[0])

  const openDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account)
      setName(account.name)
      setType(account.type)
      setBalance(String(account.balance))
      setColor(account.color)
    } else {
      setEditingAccount(null)
      setName("")
      setType("checking")
      setBalance("")
      setColor(accountColors[0])
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter an account name")
      return
    }
    setIsLoading(true)
    const supabase = createClient()

    const accountData = {
      user_id: userId,
      name: name.trim(),
      type,
      balance: Number(balance) || 0,
      color,
    }

    if (editingAccount) {
      const { data, error } = await supabase
        .from("accounts")
        .update(accountData)
        .eq("id", editingAccount.id)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        toast.error("Failed to update account")
      } else {
        setAccounts(accounts.map((a) => (a.id === data.id ? data : a)))
        toast.success("Account updated")
        setIsDialogOpen(false)
      }
    } else {
      const { data, error } = await supabase.from("accounts").insert(accountData).select().single()

      if (error) {
        toast.error("Failed to create account")
      } else {
        setAccounts([...accounts, data])
        toast.success("Account created")
        setIsDialogOpen(false)
      }
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("accounts").delete().eq("id", deleteId).eq("user_id", userId)

    if (error) {
      toast.error("Failed to delete account")
    } else {
      setAccounts(accounts.filter((a) => a.id !== deleteId))
      toast.success("Account deleted")
    }
    setDeleteId(null)
    setIsLoading(false)
  }

  const getIcon = (accountType: string) => {
    const found = accountTypes.find((t) => t.value === accountType)
    const Icon = found?.icon || Wallet
    return <Icon className="h-4 w-4" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>Manage your financial accounts</CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No accounts yet</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <div style={{ color: account.color }}>{getIcon(account.type)}</div>
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{account.type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(Number(account.balance))}</span>
                    <Button variant="ghost" size="icon" onClick={() => openDialog(account)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(account.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Update your account details." : "Add a new financial account to track."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Account["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {accountColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccount ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete all transactions associated with this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
