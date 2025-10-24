import { Helmet } from 'react-helmet';
import AppLayout from '@/components/layout/AppLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect } from 'react';
import { useHreflang } from '@/hooks/useHreflang';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/utils/languageRouting';

export default function Terms() {
  const { t, changeLanguage } = useTranslation();
  
  // Add hreflang tags for SEO
  useHreflang({
    languages: [...SUPPORTED_LANGUAGES],
    defaultLanguage: 'en'
  });
  
  // Sync language with URL
  useEffect(() => {
    const pathLang = window.location.pathname.split('/')[1];
    if (['pt', 'es', 'ar', 'vi'].includes(pathLang)) {
      changeLanguage(pathLang as SupportedLanguage);
    }
  }, [changeLanguage]);
  return (
    <>
      <Helmet>
        <title>{t('legal.terms.title', 'Terms of Service')} - The Trading Diary</title>
        <meta name="description" content={t('legal.terms.description', 'Read our terms of service and understand the rules for using The Trading Diary platform.')} />
      </Helmet>
      
      <AppLayout>
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">{t('legal.termsTitle', 'Terms of Service')}</h1>
          
          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">{t('legal.lastUpdated', 'Last updated')}: {new Date().toLocaleDateString()}</p>
            
            {/* Beta Notice */}
            <section className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">{t('legal.betaNotice', 'Beta Product Notice')}</h2>
              <p>{t('legal.betaDescription', 'The Trading Diary is currently in beta. Features and services are provided "as is" and may change without notice. We appreciate your feedback as we continue to improve.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.terms.acceptance.title', '1. Acceptance of Terms')}</h2>
              <p>{t('legal.terms.acceptance.content', 'By accessing and using The Trading Diary, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.terms.service.title', '2. Description of Service')}</h2>
              <p>{t('legal.terms.service.content', 'The Trading Diary is a platform for cryptocurrency traders to track, analyze, and improve their trading performance. We provide tools for logging trades, generating analytics, and managing trading psychology.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.terms.userContent.title', '3. User Content and Data')}</h2>
              <p>{t('legal.terms.userContent.content', 'You retain all rights to your trading data. By using our service, you grant us permission to process and store your data to provide our services. We do not claim ownership of your content.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.terms.disclaimer.title', '4. Trading Disclaimer')}</h2>
              <p>{t('legal.terms.disclaimer.content', 'Trading cryptocurrencies carries significant risk. The Trading Diary is an analytical tool only and does not provide financial advice. Past performance does not guarantee future results. You are solely responsible for your trading decisions.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.terms.refund.title', '5. Refund Policy')}</h2>
              <p>{t('legal.terms.refund.content', 'As we are in beta, we offer a 14-day money-back guarantee for all paid plans. Contact support@thetradingdiary.com to request a refund within 14 days of purchase.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.terms.termination.title', '6. Termination')}</h2>
              <p>{t('legal.terms.termination.content', 'We reserve the right to terminate or suspend your account at any time for violation of these terms. Upon termination, your right to use the service will immediately cease.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.terms.changes.title', '7. Changes to Terms')}</h2>
              <p>{t('legal.terms.changes.content', 'We may modify these terms at any time. We will notify users of significant changes via email or through the platform. Continued use of the service after changes constitutes acceptance of the new terms.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. {t('contact.title', 'Contact')}</h2>
              <p>{t('legal.terms.contact', 'If you have any questions about these Terms, please contact us at')} support@thetradingdiary.com</p>
            </section>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
