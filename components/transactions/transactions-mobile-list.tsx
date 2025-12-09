"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import type { Transaction } from "@/lib/types"
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TransactionsMobileListProps {
  transactions: Transaction[]
  onDelete: (transactionId: string) => void
  userId: string
}

export function TransactionsMobileList({ transactions, onDelete, userId }: TransactionsMobileListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income":
        return <ArrowUpRight className="h-4 w-4 text-chart-1" />
      case "expense":
        return <ArrowDownRight className="h-4 w-4 text-chart-5" />
      case "transfer":
        return <ArrowLeftRight className="h-4 w-4 text-chart-2" />
      default:
        return null
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    const supabase = createClient()
    const { error } = await supabase.from("transactions").delete().eq("id", deleteId).eq("user_id", userId)

    if (error) {
      toast.error("Failed to delete transaction")
    } else {
      toast.success("Transaction deleted")
      onDelete(deleteId)
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <p>No transactions found</p>
          <p className="text-sm mt-1">Create a budget to add transactions</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      transaction.type === "income"
                        ? "bg-chart-1/10"
                        : transaction.type === "expense"
                          ? "bg-chart-5/10"
                          : "bg-chart-2/10"
                    }`}
                  >
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {transaction.description || transaction.category?.name || "Transaction"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                      {transaction.category && (
                        <>
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: transaction.category.color }}
                          />
                          <span className="truncate">{transaction.category.name}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{transaction.account?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${transaction.type === "income" ? "text-chart-1" : transaction.type === "expense" ? "text-chart-5" : ""}`}
                  >
                    {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                  <div className="flex items-center gap-1 mt-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteId(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
