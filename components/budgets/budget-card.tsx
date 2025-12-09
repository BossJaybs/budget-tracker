"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { MoreHorizontal, Pencil, Trash2, Calendar, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"

interface BudgetCardProps {
  budget: Budget
  onEdit: () => void
  onDelete: () => void
  userId: string
  isPast?: boolean
}

export function BudgetCard({ budget, onEdit, onDelete, userId, isPast }: BudgetCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

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

  // Get type info for display
  const budgetType = (budget as Budget & { type?: string }).type || "expense"

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
