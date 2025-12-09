"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile, Account, Category } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "./profile-settings"
import { AccountsSettings } from "./accounts-settings"
import { CategoriesSettings } from "./categories-settings"
import { DataSettings } from "./data-settings"

interface SettingsClientProps {
  user: User
  profile: Profile | null
  accounts: Account[]
  categories: Category[]
}

export function SettingsClient({
  user,
  profile,
  accounts: initialAccounts,
  categories: initialCategories,
}: SettingsClientProps) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [categories, setCategories] = useState(initialCategories)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings user={user} profile={profile} />
        </TabsContent>

        <TabsContent value="accounts">
          <AccountsSettings accounts={accounts} setAccounts={setAccounts} userId={user.id} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesSettings categories={categories} setCategories={setCategories} userId={user.id} />
        </TabsContent>

        <TabsContent value="data">
          <DataSettings userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
