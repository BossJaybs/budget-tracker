import { createClient } from "@/lib/supabase/server"
import { CalendarClient } from "@/components/calendar/calendar-client"

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get all transactions for calendar display
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  return <CalendarClient transactions={transactions || []} />
}
