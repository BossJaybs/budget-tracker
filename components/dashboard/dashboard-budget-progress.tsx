"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Budget, Transaction, BudgetItem } from "@/lib/types"
import { ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DashboardBudgetProgressProps {
  initialBudgets: (Budget & { budget_items: BudgetItem[] })[]
  initialTransactions: Transaction[]
  userId: string
}

export function DashboardBudgetProgress({ initialBudgets, initialTransactions, userId }: DashboardBudgetProgressProps) {
  const [budgets, setBudgets] = useState(initialBudgets)
  const [transactions, setTransactions] = useState(initialTransactions)

  // Real-time updates for budgets and transactions
  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      // Get current month budgets
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*, budget_items(*, category:categories(*))")
        .eq("user_id", userId)
        .lte("start_date", new Date().toISOString().split("T")[0])
        .gte("end_date", new Date().toISOString().split("T")[0])

      // Get current month transactions
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*, account:accounts(*), category:categories(*)")
        .eq("user_id", userId)
        .gte("date", startOfMonth.toISOString().split("T")[0])

      if (budgetsData) setBudgets(budgetsData)
      if (transactionsData) setTransactions(transactionsData)
    }

    const budgetsChannel = supabase
      .channel("dashboard-budgets-progress")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budgets",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    const transactionsChannel = supabase
      .channel("dashboard-transactions-progress")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(budgetsChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [userId])

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

  // Get active budgets (current month)
  const activeBudgets = budgets.filter((budget) => {
    const today = new Date().toISOString().split("T")[0]
    return budget.start_date <= today && budget.end_date >= today
  }).slice(0, 3) // Limit to 3 for dashboard display

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
        {activeBudgets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active budgets</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/budgets">Create your first budget</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Active Budgets</h4>
              {activeBudgets.map((budget) => {
                const totalSpent = budget.budget_items.reduce((sum, item) => sum + getCategorySpending(item.category_id), 0)
                const totalBudget = budget.budget_items.reduce((sum, item) => sum + Number(item.planned_amount), 0)
                const percentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
                const isOverBudget = totalSpent > totalBudget

                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{budget.name}</span>
                      <span className={isOverBudget ? "text-destructive" : "text-muted-foreground"}>
                        {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                      </span>
                    </div>
                    <Progress value={percentage} className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`} />
                  </div>
                )
              })}
            </div>

            {budgetItems.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium">Category Progress</h4>
                {budgetItems.slice(0, 3).map((item) => {
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
