"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DashboardOverviewProps {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  userId: string
}

export function DashboardOverview({
  totalBalance: initialBalance,
  monthlyIncome: initialIncome,
  monthlyExpenses: initialExpenses,
  userId,
}: DashboardOverviewProps) {
  const [monthlyIncome, setMonthlyIncome] = useState(initialIncome)
  const [monthlyExpenses, setMonthlyExpenses] = useState(initialExpenses)

  const totalBalance = monthlyIncome - monthlyExpenses
  const netCashFlow = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? ((netCashFlow / monthlyIncome) * 100).toFixed(1) : "0"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      // Get current month transactions
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: transactions } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", userId)
        .gte("date", startOfMonth.toISOString().split("T")[0])

      const newIncome =
        transactions?.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const newExpenses =
        transactions?.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0) || 0

      setMonthlyIncome(newIncome)
      setMonthlyExpenses(newExpenses)
    }

    // Subscribe to transactions changes
    const transactionsChannel = supabase
      .channel("dashboard-transactions")
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

    const budgetsChannel = supabase
      .channel("dashboard-budgets")
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

    return () => {
      supabase.removeChannel(transactionsChannel)
      supabase.removeChannel(budgetsChannel)
    }
  }, [userId])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalBalance >= 0 ? "text-chart-1" : "text-chart-5"}`}>
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Income - Expenses this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-chart-1" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-1">{formatCurrency(monthlyIncome)}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <ArrowUpRight className="h-3 w-3 text-chart-1" />
            This month
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-chart-5" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-5">{formatCurrency(monthlyExpenses)}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <ArrowDownRight className="h-3 w-3 text-chart-5" />
            This month
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Flow</CardTitle>
          <div
            className={`flex items-center gap-1 text-xs font-medium ${Number(savingsRate) >= 0 ? "text-chart-1" : "text-chart-5"}`}
          >
            {savingsRate}% saved
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-chart-1" : "text-chart-5"}`}>
            {netCashFlow >= 0 ? "+" : ""}
            {formatCurrency(netCashFlow)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Income - Expenses</p>
        </CardContent>
      </Card>
    </div>
  )
}
