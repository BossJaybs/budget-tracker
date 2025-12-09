"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface BudgetsHeaderProps {
  onAddBudget: () => void
}

export function BudgetsHeader({ onAddBudget }: BudgetsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Budgets</h1>
        <p className="text-muted-foreground">Plan and track your spending limits</p>
      </div>
      <Button onClick={onAddBudget}>
        <Plus className="mr-2 h-4 w-4" />
        Create Budget
      </Button>
    </div>
  )
}
