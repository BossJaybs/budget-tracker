import { createClient } from "@/lib/supabase/server"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { DashboardRecentTransactions } from "@/components/dashboard/dashboard-recent-transactions"
import { DashboardBudgetProgress } from "@/components/dashboard/dashboard-budget-progress"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get accounts
  const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id)

  // Get current month transactions
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*)")
    .eq("user_id", user.id)
    .gte("date", startOfMonth.toISOString().split("T")[0])
    .order("date", { ascending: false })

  // Get recent transactions (last 8)
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(8)

  // Get current month budgets
  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, budget_items(*, category:categories(*))")
    .eq("user_id", user.id)
    .lte("start_date", new Date().toISOString().split("T")[0])
    .gte("end_date", new Date().toISOString().split("T")[0])

  // Calculate totals
  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0
  const monthlyIncome =
    transactions?.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const monthlyExpenses =
    transactions?.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview at a glance</p>
      </div>

      <DashboardOverview
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        userId={user.id}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardRecentTransactions transactions={recentTransactions || []} />
        <DashboardBudgetProgress budgets={budgets || []} transactions={transactions || []} />
      </div>
    </div>
  )
}
