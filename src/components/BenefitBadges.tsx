import { motion } from "framer-motion";
import { Shield, Key, Globe, Lock, Upload } from "lucide-react";

const benefits = [
  { text: "No API keys needed", icon: Key },
  { text: "Works with every exchange", icon: Globe },
  { text: "Private by default", icon: Shield },
  { text: "Safer by design", icon: Lock },
  { text: "Upload and go", icon: Upload },
];

const BenefitBadges = () => {
  // Calculate positions for circular orbit
  const getPosition = (index: number, total: number, radius: number) => {
    const angle = (index * 360) / total - 90; // Start from top
    const radian = (angle * Math.PI) / 180;
    return {
      x: radius * Math.cos(radian),
      y: radius * Math.sin(radian),
    };
  };

  return (
    <section className="py-32 md:py-40 px-6 relative overflow-hidden" aria-label="Key benefits">
      <style>{`
        @media (min-width: 768px) {
          .motion-div {
            transform: translate(calc(-50% + var(--tablet-x)), calc(-50% + var(--tablet-y))) !important;
          }
        }
        @media (min-width: 1024px) {
          .motion-div {
            transform: translate(calc(-50% + var(--desktop-x)), calc(-50% + var(--desktop-y))) !important;
          }
        }
      `}</style>
      <div className="absolute inset-0 border-t border-b border-primary/10" aria-hidden="true"></div>
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="relative w-full flex items-center justify-center" style={{ minHeight: '600px' }}>
          {/* Central Circle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute z-20"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] lg:w-[320px] lg:h-[320px] rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex flex-col items-center justify-center text-center p-6 shadow-2xl shadow-primary/30 border-4 border-primary/20"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                Built for<br />Every Trader
              </h2>
            </motion.div>
          </motion.div>

          {/* Orbital Badges */}
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const mobileRadius = 140;
            const tabletRadius = 200;
            const desktopRadius = 260;
            
            const mobilePos = getPosition(index, benefits.length, mobileRadius);
            const tabletPos = getPosition(index, benefits.length, tabletRadius);
            const desktopPos = getPosition(index, benefits.length, desktopRadius);
            
            return (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                whileInView={{ 
                  opacity: 1, 
                  scale: 1,
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.3 + index * 0.15,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                className="absolute z-10 motion-div"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${mobilePos.x}px), calc(-50% + ${mobilePos.y}px))`,
                  ['--tablet-x' as string]: `${tabletPos.x}px`,
                  ['--tablet-y' as string]: `${tabletPos.y}px`,
                  ['--desktop-x' as string]: `${desktopPos.x}px`,
                  ['--desktop-y' as string]: `${desktopPos.y}px`,
                } as React.CSSProperties}
              >
                
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <div className="w-[90px] h-[90px] md:w-[110px] md:h-[110px] lg:w-[130px] lg:h-[130px] rounded-full bg-background/80 backdrop-blur-md border-2 border-primary/40 hover:border-primary/70 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-3">
                    <Icon className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-primary" aria-hidden="true" />
                    <span className="text-[10px] md:text-xs font-semibold text-center leading-tight text-foreground/90">
                      {benefit.text}
                    </span>
                  </div>
                  
                  {/* Connection line to center */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.15 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                    viewport={{ once: true }}
                    className="absolute top-1/2 left-1/2 w-[2px] bg-gradient-to-r from-primary/30 to-transparent origin-left pointer-events-none"
                    style={{
                      height: '2px',
                      width: `${Math.sqrt(mobilePos.x ** 2 + mobilePos.y ** 2)}px`,
                      transform: `translate(-50%, -50%) rotate(${Math.atan2(-mobilePos.y, -mobilePos.x) * 180 / Math.PI}deg)`,
                    }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitBadges;
