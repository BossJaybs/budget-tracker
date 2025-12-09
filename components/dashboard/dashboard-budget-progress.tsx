import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Budget, Transaction, BudgetItem } from "@/lib/types"
import { ArrowRight } from "lucide-react"

interface DashboardBudgetProgressProps {
  budgets: (Budget & { budget_items: BudgetItem[] })[]
  transactions: Transaction[]
}

export function DashboardBudgetProgress({ budgets, transactions }: DashboardBudgetProgressProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Calculate spending for each budget item's category
  const getCategorySpending = (categoryId: string | null) => {
    if (!categoryId) return 0
    return transactions
      .filter((t) => t.category_id === categoryId && t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }

  // Get budget items with spending
  const budgetItems = budgets.flatMap((budget) =>
    budget.budget_items.map((item) => ({
      ...item,
      budgetName: budget.name,
      spent: getCategorySpending(item.category_id),
    })),
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>Track your spending limits</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/budgets">
            Manage
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {budgetItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active budgets</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/budgets">Create your first budget</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetItems.slice(0, 5).map((item) => {
              const percentage = Math.min((item.spent / Number(item.planned_amount)) * 100, 100)
              const isOverBudget = item.spent > Number(item.planned_amount)

              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.category?.name || "Uncategorized"}</span>
                    <span className={isOverBudget ? "text-destructive" : "text-muted-foreground"}>
                      {formatCurrency(item.spent)} / {formatCurrency(Number(item.planned_amount))}
                    </span>
                  </div>
                  <Progress value={percentage} className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`} />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
