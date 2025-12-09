"use client"

import { useState } from "react"
import type { Category } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

interface CategoriesSettingsProps {
  categories: Category[]
  setCategories: (categories: Category[]) => void
  userId: string
}

const categoryColors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
]

export function CategoriesSettings({ categories, setCategories, userId }: CategoriesSettingsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")
  const [color, setColor] = useState(categoryColors[0])

  const expenseCategories = categories.filter((c) => c.type === "expense")
  const incomeCategories = categories.filter((c) => c.type === "income")

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setName(category.name)
      setType(category.type)
      setColor(category.color)
    } else {
      setEditingCategory(null)
      setName("")
      setType("expense")
      setColor(categoryColors[0])
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a category name")
      return
    }
    setIsLoading(true)
    const supabase = createClient()

    const categoryData = {
      user_id: userId,
      name: name.trim(),
      type,
      color,
    }

    if (editingCategory) {
      const { data, error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", editingCategory.id)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        toast.error("Failed to update category")
      } else {
        setCategories(categories.map((c) => (c.id === data.id ? data : c)))
        toast.success("Category updated")
        setIsDialogOpen(false)
      }
    } else {
      const { data, error } = await supabase.from("categories").insert(categoryData).select().single()

      if (error) {
        toast.error("Failed to create category")
      } else {
        setCategories([...categories, data])
        toast.success("Category created")
        setIsDialogOpen(false)
      }
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("categories").delete().eq("id", deleteId).eq("user_id", userId)

    if (error) {
      toast.error("Failed to delete category")
    } else {
      setCategories(categories.filter((c) => c.id !== deleteId))
      toast.success("Category deleted")
    }
    setDeleteId(null)
    setIsLoading(false)
  }

  const CategoryList = ({ items, title }: { items: Category[]; title: string }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="font-medium">{category.name}</span>
                {category.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(category)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                {!category.is_default && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(category.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Organize your income and expenses</CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <CategoryList items={expenseCategories} title="Expense Categories" />
          <CategoryList items={incomeCategories} title="Income Categories" />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update your category." : "Create a new category."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {categoryColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>Transactions using this category will be uncategorized.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
