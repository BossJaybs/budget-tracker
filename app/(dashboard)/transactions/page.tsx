import { createClient } from "@/lib/supabase/server"
import { TransactionsClient } from "@/components/transactions/transactions-client"

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch transactions with related data
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  // Fetch accounts for the dropdown
  const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id)

  // Fetch categories for the dropdown
  const { data: categories } = await supabase.from("categories").select("*").eq("user_id", user.id)

  return (
    <TransactionsClient
      initialTransactions={transactions || []}
      accounts={accounts || []}
      categories={categories || []}
      userId={user.id}
    />
  )
}
