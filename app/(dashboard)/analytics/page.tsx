import { createClient } from "@/lib/supabase/server"
import { AnalyticsClient } from "@/components/analytics/analytics-client"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get all transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*)")
    .eq("user_id", user.id)
    .order("date", { ascending: true })

  // Get categories
  const { data: categories } = await supabase.from("categories").select("*").eq("user_id", user.id)

  // Get accounts
  const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id)

  return <AnalyticsClient transactions={transactions || []} categories={categories || []} accounts={accounts || []} />
}
