"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Transaction } from "@/lib/types"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react"

interface CalendarDayModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date | null
  transactions: Transaction[]
}

export function CalendarDayModal({ open, onOpenChange, date, transactions }: CalendarDayModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
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

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{date ? format(date, "EEEE, MMMM d, yyyy") : "Transactions"}</DialogTitle>
          <DialogDescription>
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} on this day
          </DialogDescription>
        </DialogHeader>

        {/* Day totals */}
        <div className="flex gap-4 py-2">
          <div className="flex-1 text-center p-3 rounded-lg bg-chart-1/10">
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="font-semibold text-chart-1">+{formatCurrency(totalIncome)}</p>
          </div>
          <div className="flex-1 text-center p-3 rounded-lg bg-chart-5/10">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="font-semibold text-chart-5">-{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Transaction list */}
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    transaction.type === "income"
                      ? "bg-chart-1/10"
                      : transaction.type === "expense"
                        ? "bg-chart-5/10"
                        : "bg-chart-2/10"
                  }`}
                >
                  {getTypeIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {transaction.description || transaction.category?.name || "Transaction"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category?.name} · {transaction.account?.name}
                  </p>
                </div>
              </div>
              <div
                className={`font-semibold ${transaction.type === "income" ? "text-chart-1" : transaction.type === "expense" ? "text-chart-5" : ""}`}
              >
                {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                {formatCurrency(Number(transaction.amount))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
