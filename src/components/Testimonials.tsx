import { GlassCard } from "@/components/ui/glass-card";
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
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
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
    <section className="py-16 md:py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Trusted by <span className="text-gradient-primary">10,000+</span> Traders
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            See what professional traders are saying about The Trading Diary
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass backdrop-blur-[12px] rounded-2xl p-5 md:p-6 hover-lift transition-all shadow-sm animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{testimonial.image}</div>
                <div>
                  <h4 className="font-semibold text-base md:text-lg">{testimonial.name}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-2.5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
