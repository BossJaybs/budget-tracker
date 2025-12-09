import { createClient } from "@/lib/supabase/server"
import { BudgetsClient } from "@/components/budgets/budgets-client"

export default async function BudgetsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch budgets
  const { data: budgets } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch categories for budget creation
  const { data: categories } = await supabase.from("categories").select("*").eq("user_id", user.id)

  // Fetch accounts for budget creation
  const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id)

  return (
    <BudgetsClient
      initialBudgets={budgets || []}
      categories={categories || []}
      accounts={accounts || []}
      userId={user.id}
    />
  )
}
