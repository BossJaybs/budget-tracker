"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Download, Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface DataSettingsProps {
  userId: string
}

export function DataSettings({ userId }: DataSettingsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true)
    const supabase = createClient()

    try {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*, account:accounts(name), category:categories(name)")
        .eq("user_id", userId)

      if (!transactions || transactions.length === 0) {
        toast.error("No data to export")
        setIsExporting(false)
        return
      }

      let content: string
      let filename: string
      let mimeType: string

      if (format === "json") {
        content = JSON.stringify(transactions, null, 2)
        filename = "alphawealth-export.json"
        mimeType = "application/json"
      } else {
        const headers = ["Date", "Description", "Amount", "Type", "Category", "Account"]
        const rows = transactions.map((t) => [
          t.date,
          t.description || "",
          t.amount,
          t.type,
          t.category?.name || "",
          t.account?.name || "",
        ])
        content = [headers, ...rows].map((row) => row.join(",")).join("\n")
        filename = "alphawealth-export.csv"
        mimeType = "text/csv"
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Data exported as ${format.toUpperCase()}`)
    } catch {
      toast.error("Failed to export data")
    }
    setIsExporting(false)
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Delete user data in order
      await supabase
        .from("budget_items")
        .delete()
        .in(
          "budget_id",
          (await supabase.from("budgets").select("id").eq("user_id", userId)).data?.map((b) => b.id) || [],
        )
      await supabase.from("budgets").delete().eq("user_id", userId)
      await supabase.from("transactions").delete().eq("user_id", userId)
      await supabase.from("categories").delete().eq("user_id", userId)
      await supabase.from("accounts").delete().eq("user_id", userId)
      await supabase.from("profiles").delete().eq("id", userId)

      // Sign out
      await supabase.auth.signOut()

      toast.success("Account deleted")
      router.push("/")
    } catch {
      toast.error("Failed to delete account")
    }
    setIsDeleting(false)
    setIsDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download your financial data</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" onClick={() => handleExport("csv")} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("json")} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export JSON
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data including transactions, budgets, and
              categories. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
