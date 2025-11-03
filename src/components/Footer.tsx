import { Twitter, Github, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";
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
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift" aria-label="Follow us on Twitter">
                <Twitter size={18} aria-hidden="true" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift" aria-label="Follow us on GitHub">
                <Github size={18} aria-hidden="true" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift" aria-label="Connect on LinkedIn">
                <Linkedin size={18} aria-hidden="true" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-1.5 glass-subtle rounded-lg hover-lift" aria-label="Contact us via Email">
                <Mail size={18} aria-hidden="true" />
              </a>
            </nav>
          </div>

          {/* Product */}
          <nav aria-labelledby="footer-product">
            <h3 id="footer-product" className="font-semibold mb-3 text-sm">{t('landing.footer.product')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="inline-block py-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.features')}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.howItWorks', 'How It Works')}
                </Link>
              </li>
              <li>
                <a href="/#pricing-section" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.pricing')}
                </a>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('navigation.faq')}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-labelledby="footer-support">
            <h3 id="footer-support" className="font-semibold mb-3 text-sm">{t('landing.footer.support')}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('navigation.blog', 'Blog')}
                </Link>
              </li>
              <li>
                <Link to="/crypto-trading-faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.cryptoFaq', 'Crypto Trading FAQ')}
                </Link>
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
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.contact')}
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.testimonials', 'Testimonials')}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-labelledby="footer-legal">
            <h3 id="footer-legal" className="font-semibold mb-3 text-sm">{t('landing.footer.legal')}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.aboutUs', 'About Us')}
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.sitemap', 'Sitemap')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.cookiePolicy', 'Cookie Policy')}
                </Link>
              </li>
              <li>
                <Link to="/changelog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('landing.footer.changelog', 'Changelog')}
                </Link>
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
            {t('landing.footer.copyright', '© 2025 The Trading Diary.')} {t('landing.footer.allRightsReserved')}
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
