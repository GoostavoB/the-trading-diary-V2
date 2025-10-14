import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="absolute top-6 right-6 z-50">
        <Button
          onClick={() => navigate('/auth')}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          Sign In
        </Button>
      </div>
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
