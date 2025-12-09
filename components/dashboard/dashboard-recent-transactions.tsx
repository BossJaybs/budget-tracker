import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/lib/types"
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react"

interface DashboardRecentTransactionsProps {
  transactions: Transaction[]
}

export function DashboardRecentTransactions({ transactions }: DashboardRecentTransactionsProps) {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/transactions">Add your first transaction</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      transaction.type === "income" ? "bg-chart-1/10" : "bg-chart-5/10"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="h-4 w-4 text-chart-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-chart-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {transaction.description || transaction.category?.name || "Transaction"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.category?.name} · {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <div className={`font-semibold ${transaction.type === "income" ? "text-chart-1" : "text-chart-5"}`}>
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(Number(transaction.amount))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
