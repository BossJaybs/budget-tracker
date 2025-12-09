"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
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
import { Badge } from "@/components/ui/badge"
import type { Budget } from "@/lib/types"
import { MoreHorizontal, Pencil, Trash2, Calendar, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Plus, Minus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"

interface BudgetCardProps {
  budget: Budget
  onEdit: () => void
  onDelete: () => void
  onBudgetUpdate?: (updatedBudget: Budget) => void
  userId: string
  isPast?: boolean
}

export function BudgetCard({ budget, onEdit, onDelete, onBudgetUpdate, userId, isPast }: BudgetCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentSpending, setCurrentSpending] = useState(0)
  const [isLoadingSpending, setIsLoadingSpending] = useState(true)
  const [isUpdatingAmount, setIsUpdatingAmount] = useState(false)

  // Get type info for display
  const budgetType = (budget as Budget & { type?: string }).type || "expense"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Fetch current spending from transactions within budget period
  useEffect(() => {
    const fetchCurrentSpending = async () => {
      setIsLoadingSpending(true)
      const supabase = createClient()

      try {
        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", userId)
          .gte("date", budget.start_date)
          .lte("date", budget.end_date)

        if (error) {
          console.error("Error fetching transactions:", error)
          setCurrentSpending(0)
        } else {
          // Calculate spending based on budget type
          let total = 0
          transactions?.forEach((transaction) => {
            if (budgetType === "expense" && transaction.type === "expense") {
              total += Math.abs(Number(transaction.amount))
            } else if (budgetType === "income" && transaction.type === "income") {
              total += Number(transaction.amount)
            }
          })
          setCurrentSpending(total)
        }
      } catch (error) {
        console.error("Error:", error)
        setCurrentSpending(0)
      } finally {
        setIsLoadingSpending(false)
      }
    }

    fetchCurrentSpending()
  }, [budget.id, budget.start_date, budget.end_date, budgetType, userId])

  // Real-time updates for transactions
  useEffect(() => {
    const supabase = createClient()
    
    const transactionsChannel = supabase
      .channel(`budget-${budget.id}-transactions`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch current spending when transactions change
          const fetchCurrentSpending = async () => {
            const { data: transactions } = await supabase
              .from("transactions")
              .select("amount, type")
              .eq("user_id", userId)
              .gte("date", budget.start_date)
              .lte("date", budget.end_date)

            let total = 0
            transactions?.forEach((transaction) => {
              if (budgetType === "expense" && transaction.type === "expense") {
                total += Math.abs(Number(transaction.amount))
              } else if (budgetType === "income" && transaction.type === "income") {
                total += Number(transaction.amount)
              }
            })
            setCurrentSpending(total)
          }
          
          fetchCurrentSpending()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(transactionsChannel)
    }
  }, [budget.id, budget.start_date, budget.end_date, budgetType, userId])

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase.from("budgets").delete().eq("id", budget.id).eq("user_id", userId)

    if (error) {
      toast.error("Failed to delete budget")
    } else {
      toast.success("Budget deleted")
      onDelete()
    }

    setIsDeleting(false)
    setIsDeleteDialogOpen(false)
  }

  const handleUpdateAmount = async (change: number) => {
    setIsUpdatingAmount(true)
    const supabase = createClient()

    const transactionType = change > 0 ? "income" : "expense"
    const amount = Math.abs(change)

    // Create transaction
    const transactionData = {
      user_id: userId,
      account_id: (budget as any).account_id,
      category_id: (budget as any).category_id || null,
      amount: amount,
      type: transactionType,
      description: `${budget.name} - ${transactionType}`,
      date: new Date().toISOString().split("T")[0],
    }

    const { error: transactionError } = await supabase.from("transactions").insert(transactionData)

    if (transactionError) {
      toast.error("Failed to create transaction")
      setIsUpdatingAmount(false)
      return
    }

    // Update account balance
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", (budget as any).account_id)
      .single()

    if (account) {
      const balanceChange = transactionType === "income" ? amount : -amount
      const newBalance = Number(account.balance) + balanceChange

      const { error: accountError } = await supabase
        .from("accounts")
        .update({ balance: newBalance })
        .eq("id", (budget as any).account_id)
        .eq("user_id", userId)

      if (accountError) {
        toast.error("Failed to update account balance")
      } else {
        toast.success(`${transactionType === "income" ? "Income" : "Expense"} added`)
      }
    }

    setIsUpdatingAmount(false)
  }

  const progressPercentage = budget.amount > 0 ? Math.min((currentSpending / budget.amount) * 100, 100) : 0

  const getTypeIcon = () => {
    switch (budgetType) {
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

  const getTypeBadgeVariant = (): "default" | "secondary" | "destructive" => {
    switch (budgetType) {
      case "income":
        return "default"
      case "expense":
        return "destructive"
      case "transfer":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <>
      <Card className={isPast ? "opacity-70" : ""}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getTypeIcon()}
                {budget.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(budget.start_date), "MMM d")} - {format(new Date(budget.end_date), "MMM d, yyyy")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {!isPast && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUpdateAmount(-10)}
                    disabled={isUpdatingAmount || Number(budget.amount) <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUpdateAmount(10)}
                    disabled={isUpdatingAmount}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant={getTypeBadgeVariant()} className="capitalize">
              {budgetType}
            </Badge>
            <span
              className={`text-xl font-bold ${budgetType === "income" ? "text-chart-1" : budgetType === "expense" ? "text-chart-5" : ""}`}
            >
              {budgetType === "income" ? "+" : budgetType === "expense" ? "-" : ""}
              {formatCurrency(Number(budget.amount))}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {isLoadingSpending ? "Loading..." : `${formatCurrency(currentSpending)} spent`}
              </span>
              <span>{formatCurrency(Number(budget.amount))} budget</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {progressPercentage.toFixed(1)}% used
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{budget.name}&rdquo;? This action cannot be undone.
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
