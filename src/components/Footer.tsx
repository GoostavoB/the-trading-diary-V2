import { Twitter, Github, Linkedin, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/hooks/useTranslation";
import NewsletterSignup from "@/components/NewsletterSignup";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t border-border/50 py-12 px-6 bg-background/60 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl">
        {/* Newsletter Section */}
        <div className="mb-10">
          <NewsletterSignup />
        </div>
        
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-3">
              <Logo size="lg" variant="horizontal" showText={true} />
            </div>
            <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
              {t('landing.footer.tagline')}
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift">
                <Github size={18} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift">
                <Linkedin size={18} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('landing.footer.product')}</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.features')}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.pricing')}
                </a>
              </li>
              <li>
                <a href="/faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('navigation.faq')}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('landing.footer.support')}</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Blog
                </a>
              </li>
              <li>
                <a href="/crypto-trading-faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Crypto Trading FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.help')}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.documentation')}
                </a>
              </li>
              <li>
                <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.contact')}
                </a>
              </li>
              <li>
                <a href="/testimonials" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Testimonials
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('landing.footer.legal')}</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="/sitemap" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Sitemap
                </a>
              </li>
              <li>
                <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.terms')}
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.privacy')}
                </a>
              </li>
              <li>
                <a href="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="/changelog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Changelog
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-muted-foreground text-xs md:text-sm">
            © 2025 The Trading Diary. {t('landing.footer.allRightsReserved')}
          </p>
          <p className="text-muted-foreground text-xs md:text-sm">
            {t('landing.footer.madeWith')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
