import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "@/components/settings/settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id)

  const { data: categories } = await supabase.from("categories").select("*").eq("user_id", user.id)

  return <SettingsClient user={user} profile={profile} accounts={accounts || []} categories={categories || []} />
}
