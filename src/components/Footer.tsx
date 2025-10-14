import { TrendingUp } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-neon-green" size={32} />
            <span className="text-2xl font-bold gradient-text">BullBear Journal</span>
          </div>
          
          <nav className="flex gap-8">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Blog
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>
          
          <p className="text-muted-foreground text-sm">
            © 2025 BullBear Journal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
