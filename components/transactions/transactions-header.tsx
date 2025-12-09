"use client"

// interface TransactionsHeaderProps {
//   onAddTransaction: () => void
// }

export function TransactionsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">Manage your income and expenses</p>
      </div>
      {/* Removed Add Transaction button and onAddTransaction prop */}
    </div>
  )
}
