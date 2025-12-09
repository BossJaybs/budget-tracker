"use client"

import { useState, useEffect } from "react"
import type { Transaction, Account, Category } from "@/lib/types"
import { TransactionsHeader } from "./transactions-header"
import { TransactionsFilters } from "./transactions-filters"
import { TransactionsTable } from "./transactions-table"
import { TransactionsMobileList } from "./transactions-mobile-list"
import { createClient } from "@/lib/supabase/client"

interface TransactionsClientProps {
  initialTransactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  userId: string
}

export function TransactionsClient({ initialTransactions, accounts, categories, userId }: TransactionsClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [filters, setFilters] = useState({
    dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
    category: "all",
    type: "all",
    search: "",
  })

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Refetch transactions with joined data
          const { data } = await supabase
            .from("transactions")
            .select("*, account:accounts(*), category:categories(*)")
            .eq("user_id", userId)
            .order("date", { ascending: false })

          if (data) {
            setTransactions(data)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    // Date range filter
    if (filters.dateRange.from && new Date(t.date) < filters.dateRange.from) return false
    if (filters.dateRange.to && new Date(t.date) > filters.dateRange.to) return false

    // Category filter
    if (filters.category !== "all" && t.category_id !== filters.category) return false

    // Type filter
    if (filters.type !== "all" && t.type !== filters.type) return false

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesDescription = t.description?.toLowerCase().includes(searchLower)
      const matchesCategory = t.category?.name?.toLowerCase().includes(searchLower)
      if (!matchesDescription && !matchesCategory) return false
    }

    return true
  })

  const handleTransactionDeleted = (transactionId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId))
  }

  return (
    <div className="space-y-6">
      <TransactionsHeader />

      <TransactionsFilters filters={filters} onFiltersChange={setFilters} categories={categories} />

      {/* Desktop Table */}
      <div className="hidden md:block">
        <TransactionsTable transactions={filteredTransactions} onDelete={handleTransactionDeleted} userId={userId} />
      </div>

      {/* Mobile List */}
      <div className="md:hidden">
        <TransactionsMobileList
          transactions={filteredTransactions}
          onDelete={handleTransactionDeleted}
          userId={userId}
        />
      </div>
    </div>
  )
}
