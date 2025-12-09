"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Transaction, Category, Account } from "@/lib/types"
import { SpendingByCategoryChart } from "./spending-by-category-chart"
import { IncomeExpenseTrendChart } from "./income-expense-trend-chart"
import { TopCategoriesCard } from "./top-categories-card"
import { MonthComparisonCard } from "./month-comparison-card"
import { subMonths, startOfMonth, endOfMonth, format, isWithinInterval } from "date-fns"

interface AnalyticsClientProps {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
}

export function AnalyticsClient({ transactions, categories, accounts }: AnalyticsClientProps) {
  const [timeRange, setTimeRange] = useState("12")

  // Get date range
  const months = Number.parseInt(timeRange)
  const endDate = endOfMonth(new Date())
  const startDate = startOfMonth(subMonths(new Date(), months - 1))

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = new Date(t.date)
      return isWithinInterval(txDate, { start: startDate, end: endDate })
    })
  }, [transactions, startDate, endDate])

  // Calculate total income and expenses
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += Number(t.amount)
        if (t.type === "expense") acc.expense += Number(t.amount)
        return acc
      },
      { income: 0, expense: 0 },
    )
  }, [filteredTransactions])

  const netWorth = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Insights into your financial health</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-2xl text-chart-1">{formatCurrency(totals.income)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {format(startDate, "MMM yyyy")} - {format(endDate, "MMM yyyy")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl text-chart-5">{formatCurrency(totals.expense)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {format(startDate, "MMM yyyy")} - {format(endDate, "MMM yyyy")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Worth</CardDescription>
            <CardTitle className={`text-2xl ${netWorth >= 0 ? "text-chart-1" : "text-chart-5"}`}>
              {formatCurrency(netWorth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across {accounts.length} accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingByCategoryChart transactions={filteredTransactions} categories={categories} />
        <IncomeExpenseTrendChart transactions={filteredTransactions} months={months} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopCategoriesCard transactions={filteredTransactions} />
        <MonthComparisonCard transactions={transactions} />
      </div>
    </div>
  )
}
