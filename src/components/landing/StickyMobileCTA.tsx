import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const StickyMobileCTA = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (roughly 100vh)
      const scrolled = window.scrollY > window.innerHeight;
      
      // Hide when pricing section is visible (roughly 80% down the page)
      const pricingSection = document.getElementById('pricing-section');
      const isPricingVisible = pricingSection 
        ? pricingSection.getBoundingClientRect().top < window.innerHeight
        : false;
      
      setIsVisible(scrolled && !isPricingVisible);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-xl border-t border-primary/20 shadow-2xl"
        >
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg" 
            className="w-full h-14 text-base font-semibold"
          >
            Start Free Trial
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyMobileCTA;
