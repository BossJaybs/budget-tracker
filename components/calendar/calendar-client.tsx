"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns"
import { CalendarDayModal } from "./calendar-day-modal"

interface CalendarClientProps {
  transactions: Transaction[]
}

export function CalendarClient({ transactions }: CalendarClientProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Group transactions by date
  const transactionsByDate = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {}
    transactions.forEach((t) => {
      const dateKey = t.date
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(t)
    })
    return grouped
  }, [transactions])

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    const totals: Record<string, { income: number; expense: number }> = {}
    Object.entries(transactionsByDate).forEach(([date, txns]) => {
      totals[date] = {
        income: txns.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0),
        expense: txns.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0),
      }
    })
    return totals
  }, [transactionsByDate])

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Calculate month totals
  const monthTotals = useMemo(() => {
    const monthTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date)
      return isSameMonth(txDate, currentMonth)
    })
    return {
      income: monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0),
      expense: monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0),
    }
  }, [transactions, currentMonth])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get intensity for spending visualization
  const getExpenseIntensity = (expense: number) => {
    if (expense === 0) return ""
    if (expense < 50) return "bg-chart-5/10"
    if (expense < 100) return "bg-chart-5/20"
    if (expense < 250) return "bg-chart-5/30"
    if (expense < 500) return "bg-chart-5/40"
    return "bg-chart-5/50"
  }

  const selectedDateTransactions = selectedDate ? transactionsByDate[format(selectedDate, "yyyy-MM-dd")] || [] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">Visualize your spending by day</p>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Month Income</div>
            <div className="text-2xl font-bold text-chart-1">+{formatCurrency(monthTotals.income)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Month Expenses</div>
            <div className="text-2xl font-bold text-chart-5">-{formatCurrency(monthTotals.expense)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>Click on a day to see transaction details</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const dayTotals = dailyTotals[dateKey]
              const hasTransactions = !!transactionsByDate[dateKey]
              const isCurrentMonth = isSameMonth(day, currentMonth)

              return (
                <button
                  key={dateKey}
                  onClick={() => hasTransactions && setSelectedDate(day)}
                  disabled={!hasTransactions}
                  className={`
                    relative min-h-[80px] md:min-h-[100px] p-1 md:p-2 rounded-lg border transition-all
                    ${isCurrentMonth ? "bg-card" : "bg-muted/30 opacity-50"}
                    ${hasTransactions ? "cursor-pointer hover:border-primary" : "cursor-default"}
                    ${isToday(day) ? "border-primary" : "border-border"}
                    ${dayTotals ? getExpenseIntensity(dayTotals.expense) : ""}
                  `}
                >
                  <span
                    className={`
                    text-sm font-medium
                    ${isToday(day) ? "text-primary" : isCurrentMonth ? "" : "text-muted-foreground"}
                  `}
                  >
                    {format(day, "d")}
                  </span>

                  {dayTotals && (
                    <div className="absolute bottom-1 left-1 right-1 space-y-0.5">
                      {dayTotals.income > 0 && (
                        <div className="text-[10px] md:text-xs text-chart-1 truncate">
                          +{formatCurrency(dayTotals.income)}
                        </div>
                      )}
                      {dayTotals.expense > 0 && (
                        <div className="text-[10px] md:text-xs text-chart-5 truncate">
                          -{formatCurrency(dayTotals.expense)}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-3 w-3 rounded bg-chart-5/10" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-3 w-3 rounded bg-chart-5/30" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-3 w-3 rounded bg-chart-5/50" />
              <span>High</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day detail modal */}
      <CalendarDayModal
        open={!!selectedDate}
        onOpenChange={() => setSelectedDate(null)}
        date={selectedDate}
        transactions={selectedDateTransactions}
      />
    </div>
  )
}
