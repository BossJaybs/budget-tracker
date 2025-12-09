import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = []

export function LandingTestimonials() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial, index) => (
        <Card key={index} className="bg-white dark:bg-gray-900">
          <CardContent className="flex flex-col items-center p-6">
            <Avatar className="mb-4">
              <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
              <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mb-2">{testimonial.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{testimonial.role}</p>
            <p className="text-center text-gray-700 dark:text-gray-300">{testimonial.content}</p>
            <div className="mt-6 flex items-center justify-center">
              <Star className="text-yellow-500" />
              <Star className="text-yellow-500" />
              <Star className="text-yellow-500" />
              <Star className="text-yellow-500" />
              <Star className="text-gray-300" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
