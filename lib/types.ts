export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  currency: string
  created_at: string
  updated_at: string
}

export type Account = {
  id: string
  user_id: string
  name: string
  type: "checking" | "savings" | "credit_card" | "cash" | "investment" | "other"
  balance: number
  color: string
  icon: string | null
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  type: "income" | "expense"
  color: string
  icon: string | null
  is_default: boolean
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  amount: number
  type: "income" | "expense" | "transfer"
  description: string | null
  date: string
  created_at: string
  updated_at: string
  // Joined fields
  account?: Account
  category?: Category
}

export type Budget = {
  id: string
  user_id: string
  name: string
  period: "monthly" | "custom"
  start_date: string
  end_date: string
  amount: number
  rollover: boolean
  account_id?: string
  category_id?: string
  type?: "income" | "expense" | "transfer"
  created_at: string
  updated_at: string
}

export type BudgetItem = {
  id: string
  budget_id: string
  category_id: string | null
  planned_amount: number
  created_at: string
  category?: Category
}
