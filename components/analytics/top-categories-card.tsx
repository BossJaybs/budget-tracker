"use client"

import type React from "react"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Transaction } from "@/lib/types"

interface TopCategoriesCardProps {
  transactions: Transaction[]
}

export function TopCategoriesCard({ transactions }: TopCategoriesCardProps) {
  const topCategories = useMemo(() => {
    const expenseTransactions = transactions.filter((t) => t.type === "expense")
    const categoryTotals: Record<string, { amount: number; color: string }> = {}

    expenseTransactions.forEach((t) => {
      const categoryName = t.category?.name || "Uncategorized"
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = {
          amount: 0,
          color: t.category?.color || "#6b7280",
        }
      }
      categoryTotals[categoryName].amount += Number(t.amount)
    })

    const sorted = Object.entries(categoryTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const maxAmount = sorted[0]?.amount || 1
    return sorted.map((cat) => ({
      ...cat,
      percentage: (cat.amount / maxAmount) * 100,
    }))
  }, [transactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (topCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
          <CardDescription>Your highest expense areas</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
          No expense data available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Spending Categories</CardTitle>
        <CardDescription>Your highest expense areas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topCategories.map((category, index) => (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-4">{index + 1}.</span>
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="font-medium">{category.name}</span>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(category.amount)}</span>
            </div>
            <Progress
              value={category.percentage}
              className="h-2"
              style={{ "--progress-color": category.color } as React.CSSProperties}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
