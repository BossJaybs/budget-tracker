import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Calendar, CreditCard, PieChart, Settings, Wallet } from "lucide-react"

const features = [
  {
    icon: Wallet,
    title: "Multi-Account Tracking",
    description: "Connect all your accounts - checking, savings, credit cards, and cash - in one unified dashboard.",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    icon: CreditCard,
    title: "Transaction Management",
    description: "Log expenses and income with smart categorization. Import transactions via CSV for quick setup.",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    icon: Calendar,
    title: "Calendar View",
    description: "Visualize your spending on a monthly calendar. See daily totals and identify spending patterns.",
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  {
    icon: PieChart,
    title: "Budget Planning",
    description: "Create monthly or custom budgets for each category. Track progress with visual indicators.",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    description: "Gain insights with spending breakdowns, income trends, and category comparisons over time.",
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
  {
    icon: Settings,
    title: "Customizable Categories",
    description: "Create your own expense and income categories. Personalize colors and icons to match your workflow.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to manage your finances</h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to help you take control of your money and build better financial habits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor} mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
