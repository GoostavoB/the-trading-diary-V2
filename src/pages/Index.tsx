import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CryptoPrices } from "@/components/CryptoPrices";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <CryptoPrices />
      <div className="absolute top-14 right-6 z-50">
        <Button
          onClick={() => navigate('/auth')}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          Sign In
        </Button>
      </div>
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
