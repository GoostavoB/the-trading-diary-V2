import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "horizontal";
  showText?: boolean;
  className?: string;
  colorVariant?: "default" | "vietnam" | "auto";
}

const sizeMap = {
  sm: { icon: "h-6 w-6", text: "text-sm" },
  md: { icon: "h-8 w-8", text: "text-base" },
  lg: { icon: "h-10 w-10", text: "text-lg" },
  xl: { icon: "h-12 w-12", text: "text-xl" },
};

export const Logo = ({ 
  size = "md", 
  variant = "full", 
  showText = true,
  className,
  colorVariant = "auto"
}: LogoProps) => {
  const { icon, text } = sizeMap[size];
  const iconOnly = variant === "icon" || !showText;
  
  // Auto-detect Vietnam theme
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  
  useEffect(() => {
    const savedMode = localStorage.getItem('theme:mode') || 'ocean';
    setCurrentTheme(savedMode);
    
    // Listen for theme changes
    const handleStorageChange = () => {
      const mode = localStorage.getItem('theme:mode') || 'ocean';
      setCurrentTheme(mode);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Determine if Vietnam variant should be used
  const isVietnam = colorVariant === "vietnam" || (colorVariant === "auto" && currentTheme === "vietnam");
  const primaryColor = isVietnam ? "#DA251D" : "hsl(var(--primary))";
  const gradientColor1 = isVietnam ? "#DA251D" : "hsl(var(--primary))";
  const gradientColor2 = isVietnam ? "#B01F18" : "hsl(var(--primary))";

  return (
    <div className={cn(
      "flex items-center gap-3",
      variant === "full" && "flex-col",
      variant === "horizontal" && "flex-row",
      className
    )}>
      {/* TD Monogram - Financial Times inspired */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(icon, "shrink-0 text-primary")}
        aria-label="The Trading Diary Logo"
        style={{
          color: primaryColor
        }}
      >
        <defs>
          {/* Gradient for premium feel - dynamically uses primary color */}
          <linearGradient id={`logoGradient-${colorVariant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: gradientColor1, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: gradientColor2, stopOpacity: 0.85 }} />
          </linearGradient>
        </defs>
        
        {/* T letter - vertical and horizontal bars */}
        {/* Horizontal top bar of T */}
        <rect
          x="8"
          y="10"
          width="24"
          height="5"
          fill={`url(#logoGradient-${colorVariant})`}
        />
        
        {/* Vertical stem of T */}
        <rect
          x="17"
          y="10"
          width="6"
          height="28"
          fill={`url(#logoGradient-${colorVariant})`}
        />
        
        {/* D letter - intertwined with T */}
        {/* Vertical bar of D */}
        <rect
          x="25"
          y="15"
          width="6"
          height="23"
          fill={`url(#logoGradient-${colorVariant})`}
        />
        
        {/* D curve with transparent inner using even-odd */}
        <path
          d="M 31 15 L 38 15 Q 42 15 42 19 L 42 34 Q 42 38 38 38 L 31 38 Z
             M 31 20 L 35 20 Q 37 20 37 22 L 37 31 Q 37 33 35 33 L 31 33 Z"
          fillRule="evenodd"
          clipRule="evenodd"
          fill={`url(#logoGradient-${colorVariant})`}
        />
        
        {/* Yellow star inside D for Vietnam variant */}
        {isVietnam && (
          <path
            d="M 36.5 23 L 37.2 25.5 L 39.8 25.5 L 37.8 27 L 38.5 29.5 L 36.5 28 L 34.5 29.5 L 35.2 27 L 33.2 25.5 L 35.8 25.5 Z"
            fill="#FFCD00"
          />
        )}
        
        {/* Subtle border for definition */}
        <rect
          x="7"
          y="9"
          width="36"
          height="30"
          rx="2"
          stroke={primaryColor}
          strokeWidth="0.5"
          fill="none"
          opacity="0.2"
        />
      </svg>

      {/* Brand text */}
      {!iconOnly && (
        <span className={cn(
          "font-semibold tracking-tight",
          text,
          variant === "full" ? "text-center" : ""
        )}>
          The Trading Diary
        </span>
      )}
    </div>
  );
};
