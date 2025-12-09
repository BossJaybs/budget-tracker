import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, PieChart, Calendar } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-6">
            Take control of your money <span className="text-primary">in minutes</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            Track your spending, plan your budgets, and gain powerful insights into your financial health. AlphaWealth
            makes personal finance simple and beautiful.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" asChild className="h-12 px-8 text-base">
              <Link href="/auth/sign-up">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base bg-transparent">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>

          {/* Feature preview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                <TrendingUp className="h-5 w-5 text-chart-1" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Smart Analytics</p>
                <p className="text-xs text-muted-foreground">Track spending patterns</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <PieChart className="h-5 w-5 text-chart-2" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Budget Planner</p>
                <p className="text-xs text-muted-foreground">Set & achieve goals</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                <Calendar className="h-5 w-5 text-chart-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Calendar View</p>
                <p className="text-xs text-muted-foreground">Daily expense tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
