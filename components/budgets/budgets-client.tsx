"use client"

import { useState, useEffect } from "react"
import type { Budget, Category, Account } from "@/lib/types"
import { BudgetsHeader } from "./budgets-header"
import { BudgetCard } from "./budget-card"
import { BudgetDialog } from "./budget-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface BudgetsClientProps {
  initialBudgets: Budget[]
  categories: Category[]
  accounts: Account[]
  userId: string
}

export function BudgetsClient({ initialBudgets, categories, accounts, userId }: BudgetsClientProps) {
  const [budgets, setBudgets] = useState(initialBudgets)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  // Real-time updates for budgets and transactions
  useEffect(() => {
    const supabase = createClient()

    const budgetsChannel = supabase
      .channel("budgets-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budgets",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Refetch budgets
          const { data } = await supabase
            .from("budgets")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

          if (data) {
            setBudgets(data)
          }
        },
      )
      .subscribe()

    const transactionsChannel = supabase
      .channel("budgets-transactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Refetch budgets when transactions change
          const { data } = await supabase
            .from("budgets")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

          if (data) {
            setBudgets(data)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(budgetsChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [userId])

  const handleAddBudget = () => {
    setEditingBudget(null)
    setIsDialogOpen(true)
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setIsDialogOpen(true)
  }

  const handleBudgetSaved = (savedBudget: Budget) => {
    if (editingBudget) {
      setBudgets((prev) => prev.map((b) => (b.id === savedBudget.id ? savedBudget : b)))
    } else {
      setBudgets((prev) => [savedBudget, ...prev])
    }
    setIsDialogOpen(false)
    setEditingBudget(null)
  }

  const handleBudgetDeleted = (budgetId: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId))
  }

  // Separate active and past budgets
  const today = new Date().toISOString().split("T")[0]
  const activeBudgets = budgets.filter((b) => b.end_date >= today)
  const pastBudgets = budgets.filter((b) => b.end_date < today)

  return (
    <div className="space-y-6">
      <BudgetsHeader onAddBudget={handleAddBudget} />

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>No budgets created yet</p>
            <p className="text-sm mt-1">Create your first budget to start tracking your spending</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeBudgets.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Active Budgets</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeBudgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={() => handleEditBudget(budget)}
                    onDelete={() => handleBudgetDeleted(budget.id)}
                    onBudgetUpdate={(updatedBudget) => {
                      setBudgets((prev) => prev.map((b) => (b.id === updatedBudget.id ? updatedBudget : b)))
                    }}
                    userId={userId}
                  />
                ))}
              </div>
            </div>
          )}

          {pastBudgets.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground">Past Budgets</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pastBudgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={() => handleEditBudget(budget)}
                    onDelete={() => handleBudgetDeleted(budget.id)}
                    onBudgetUpdate={(updatedBudget) => {
                      setBudgets((prev) => prev.map((b) => (b.id === updatedBudget.id ? updatedBudget : b)))
                    }}
                    userId={userId}
                    isPast
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        budget={editingBudget}
        categories={categories}
        accounts={accounts}
        userId={userId}
        onSaved={handleBudgetSaved}
      />
    </div>
  )
}
