import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, LineChart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bullBearRealistic from "@/assets/bull-bear-realistic.png";

const Hero = () => {
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Unified Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]"></div>

      {/* Bull vs Bear - Full Scene with Parallax */}
      <div 
        className="absolute inset-0 z-0 flex items-center justify-center"
        style={{
          transform: `scale(${1 + scrollY * 0.0002}) translateY(${scrollY * 0.15}px)`,
          opacity: Math.max(0.12 - scrollY * 0.00015, 0.04),
          transition: 'transform 0.1s ease-out',
        }}
      >
        <img 
          src={bullBearRealistic} 
          alt="Bull vs Bear battle"
          className="w-full h-full object-cover"
          style={{
            minWidth: '100vw',
            minHeight: '100vh',
            objectPosition: 'center',
          }}
        />
      </div>

      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-neon-green/5 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-neon-red/5 rounded-full blur-[150px]"></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="hidden md:flex justify-center mb-6 gap-4">
          <TrendingUp className="text-foreground/70 hover:text-neon-green transition-colors duration-300" size={48} />
          <BarChart3 className="text-foreground/70" size={48} />
          <LineChart className="text-foreground/70 hover:text-neon-red transition-colors duration-300" size={48} />
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
          <span className="gradient-text">The Trading</span>
          <br />
          Diary
        </h1>
        
        <p className="text-2xl md:text-3xl font-light mb-4 text-muted-foreground">
          Your trades. Your data. Your edge.
        </p>
        
        <p className="text-lg md:text-xl mb-12 text-muted-foreground max-w-2xl mx-auto">
          The premium trading journal for serious traders. Track performance, analyze patterns, 
          and gain the competitive edge you need to consistently win.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 bg-foreground text-background hover:bg-foreground/90 font-semibold group relative overflow-hidden"
          >
            <span className="relative z-10">Start Trading Smarter</span>
            <div className="absolute inset-0 bg-neon-green opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            disabled
            className="text-lg px-8 py-6 border-2 border-border text-foreground hover:border-foreground/50 hover:bg-foreground/5 transition-all duration-300"
          >
            View Demo <span className="ml-2 text-sm opacity-70">(Coming Soon)</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-2">10K+</div>
            <div className="text-muted-foreground">Active Traders</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-2">2M+</div>
            <div className="text-muted-foreground">Trades Logged</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-2">98%</div>
            <div className="text-muted-foreground">Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
