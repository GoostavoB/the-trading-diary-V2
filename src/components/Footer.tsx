import { Twitter, Github, Linkedin, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/hooks/useTranslation";
import NewsletterSignup from "@/components/NewsletterSignup";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t border-border/50 py-12 px-6 bg-background/60 backdrop-blur-sm" role="contentinfo">
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
            <nav aria-label="Social media links" className="flex gap-3">
              <a
                href="https://twitter.com/thetradingdiary"
                target="_blank"
                rel="noopener noreferrer me"
                className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift"
                aria-label="Follow The Trading Diary on Twitter"
              >
                <Twitter size={18} aria-hidden="true" />
              </a>
              <a
                href="https://github.com/thetradingdiary"
                target="_blank"
                rel="noopener noreferrer me"
                className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift"
                aria-label="Follow The Trading Diary on GitHub"
              >
                <Github size={18} aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/company/thetradingdiary"
                target="_blank"
                rel="noopener noreferrer me"
                className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift"
                aria-label="Connect with The Trading Diary on LinkedIn"
              >
                <Linkedin size={18} aria-hidden="true" />
              </a>
              <a
                href="/contact"
                className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift"
                aria-label="Contact The Trading Diary via Email"
              >
                <Mail size={18} aria-hidden="true" />
              </a>
            </nav>
          </div>

          {/* Product */}
          <nav aria-labelledby="footer-product">
            <h3 id="footer-product" className="font-semibold mb-3 text-sm">{t('landing.footer.product')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="/features" className="inline-block py-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.features')}
                </a>
              </li>
              <li>
                <a href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.pricing')}
                </a>
              </li>
              <li>
                <a href="/faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('navigation.faq')}
                </a>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-labelledby="footer-support">
            <h3 id="footer-support" className="font-semibold mb-3 text-sm">{t('landing.footer.support')}</h3>
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
                <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.help')}
                </a>
              </li>
              <li>
                <a href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
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
          </nav>

          {/* Company */}
          <nav aria-labelledby="footer-legal">
            <h3 id="footer-legal" className="font-semibold mb-3 text-sm">{t('landing.footer.legal')}</h3>
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
          </nav>
        </div>

        {/* Security Badge */}
        <div className="pb-6 border-b border-border/50">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass-subtle border border-primary/20">
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs md:text-sm text-muted-foreground">
              {t('landing.footer.securityBadge')}
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
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
