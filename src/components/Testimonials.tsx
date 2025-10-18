import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Day Trader",
    image: "👨‍💼",
    rating: 5,
    text: "This journal completely transformed my trading. I can finally see my patterns and what makes me profitable. Win rate went from 52% to 68% in 3 months.",
  },
  {
    name: "Sarah Mitchell",
    role: "Crypto Trader",
    image: "👩‍💻",
    rating: 5,
    text: "The emotional tags feature is genius. I realized I was revenge trading after losses. Now I take a break and come back stronger. My consistency has never been better.",
  },
  {
    name: "Marcus Rodriguez",
    role: "Swing Trader",
    image: "👨‍🚀",
    rating: 5,
    text: "AI extraction saves me 2 hours per week. Upload screenshots, done. The analytics show me exactly which setups work and which to avoid. Worth every penny.",
  },
  {
    name: "Emma Thompson",
    role: "Forex Trader",
    image: "👩‍🎨",
    rating: 5,
    text: "Best trading tool I've ever used. The forecasting feature helps me set realistic goals. I finally feel in control of my trading career.",
  },
  {
    name: "James Park",
    role: "Options Trader",
    image: "👨‍🔬",
    rating: 5,
    text: "Clean, fast, and powerful. The performance dashboard gives me instant insight into my trading health. It's like having a coach in my pocket.",
  },
  {
    name: "Lisa Wang",
    role: "Futures Trader",
    image: "👩‍⚕️",
    rating: 5,
    text: "The setup tracking is incredibly detailed. I can see which strategies work best for different market conditions. My edge has never been clearer.",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Trusted by <span className="gradient-text">10,000+</span> Traders
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what professional traders are saying about The Trading Diary
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{testimonial.image}</div>
                <div>
                  <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} size={16} className="fill-neon-green text-neon-green" />
                ))}
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                "{testimonial.text}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
