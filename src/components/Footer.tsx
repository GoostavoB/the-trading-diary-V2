import { TrendingUp } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-foreground" size={32} />
            <span className="text-2xl font-bold">The Trade Diary</span>
          </div>
          
          <nav className="flex gap-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-neon-green group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-foreground group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              Blog
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-foreground group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-neon-red group-hover:w-full transition-all duration-300"></span>
            </a>
          </nav>
          
          <p className="text-muted-foreground text-sm">
            © 2025 The Trade Diary. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
