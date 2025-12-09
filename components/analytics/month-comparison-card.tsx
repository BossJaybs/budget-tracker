"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Transaction } from "@/lib/types"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

interface MonthComparisonCardProps {
  transactions: Transaction[]
}

export function MonthComparisonCard({ transactions }: MonthComparisonCardProps) {
  const comparison = useMemo(() => {
    const now = new Date()

    // Current month
    const currentStart = startOfMonth(now)
    const currentEnd = endOfMonth(now)
    const currentTransactions = transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start: currentStart, end: currentEnd }),
    )
    const currentExpense = currentTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const currentIncome = currentTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    // Previous month
    const prevMonthDate = subMonths(now, 1)
    const prevStart = startOfMonth(prevMonthDate)
    const prevEnd = endOfMonth(prevMonthDate)
    const prevTransactions = transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start: prevStart, end: prevEnd }),
    )
    const prevExpense = prevTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const prevIncome = prevTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0)

    const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0
    const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0

    return {
      currentMonth: format(now, "MMMM"),
      prevMonth: format(prevMonthDate, "MMMM"),
      currentExpense,
      currentIncome,
      prevExpense,
      prevIncome,
      expenseChange,
      incomeChange,
    }
  }, [transactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getChangeIcon = (change: number, inverse = false) => {
    if (Math.abs(change) < 1) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (inverse) {
      return change > 0 ? (
        <ArrowUpRight className="h-4 w-4 text-chart-5" />
      ) : (
        <ArrowDownRight className="h-4 w-4 text-chart-1" />
      )
    }
    return change > 0 ? (
      <ArrowUpRight className="h-4 w-4 text-chart-1" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-chart-5" />
    )
  }

  const getChangeColor = (change: number, inverse = false) => {
    if (Math.abs(change) < 1) return "text-muted-foreground"
    if (inverse) {
      return change > 0 ? "text-chart-5" : "text-chart-1"
    }
    return change > 0 ? "text-chart-1" : "text-chart-5"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Month vs Month</CardTitle>
        <CardDescription>
          {comparison.currentMonth} compared to {comparison.prevMonth}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Income</span>
            <div className="flex items-center gap-2">
              {getChangeIcon(comparison.incomeChange)}
              <span className={`text-sm font-medium ${getChangeColor(comparison.incomeChange)}`}>
                {comparison.incomeChange > 0 ? "+" : ""}
                {comparison.incomeChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-chart-1">{formatCurrency(comparison.currentIncome)}</span>
            <span className="text-sm text-muted-foreground">vs {formatCurrency(comparison.prevIncome)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expenses</span>
            <div className="flex items-center gap-2">
              {getChangeIcon(comparison.expenseChange, true)}
              <span className={`text-sm font-medium ${getChangeColor(comparison.expenseChange, true)}`}>
                {comparison.expenseChange > 0 ? "+" : ""}
                {comparison.expenseChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-chart-5">{formatCurrency(comparison.currentExpense)}</span>
            <span className="text-sm text-muted-foreground">vs {formatCurrency(comparison.prevExpense)}</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Net Savings</span>
            <span
              className={`font-semibold ${comparison.currentIncome - comparison.currentExpense >= 0 ? "text-chart-1" : "text-chart-5"}`}
            >
              {formatCurrency(comparison.currentIncome - comparison.currentExpense)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
