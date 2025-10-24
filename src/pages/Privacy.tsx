import { Helmet } from 'react-helmet';
import AppLayout from '@/components/layout/AppLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect } from 'react';
import { useHreflang } from '@/hooks/useHreflang';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/utils/languageRouting';

export default function Privacy() {
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
        <title>{t('legal.privacyTitle', 'Privacy Policy')} - The Trading Diary</title>
        <meta name="description" content={t('legal.privacy.description', 'Learn how The Trading Diary collects, uses, and protects your personal information.')} />
      </Helmet>
      
      <AppLayout>
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">{t('legal.privacyTitle', 'Privacy Policy')}</h1>
          
          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">{t('legal.lastUpdated', 'Last updated')}: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.intro.title', '1. Introduction')}</h2>
              <p>{t('legal.privacy.intro.content', 'This Privacy Policy explains how The Trading Diary collects, uses, and protects your personal information. We are committed to protecting your privacy and complying with applicable data protection laws, including GDPR.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.collection.title', '2. Information We Collect')}</h2>
              <p>{t('legal.privacy.collection.content', 'We collect the following types of information:')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('legal.privacy.collection.items.account', 'Account information (email, name)')}</li>
                <li>{t('legal.privacy.collection.items.trading', 'Trading data you upload')}</li>
                <li>{t('legal.privacy.collection.items.usage', 'Usage data and analytics')}</li>
                <li>{t('legal.privacy.collection.items.technical', 'Technical data (IP address, browser type)')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.usage.title', '3. How We Use Your Data')}</h2>
              <p>{t('legal.privacy.usage.content', 'We use your information to:')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('legal.privacy.usage.items.service', 'Provide and maintain our service')}</li>
                <li>{t('legal.privacy.usage.items.support', 'Provide customer support')}</li>
                <li>{t('legal.privacy.usage.items.analytics', 'Generate analytics and insights')}</li>
                <li>{t('legal.privacy.usage.items.improvements', 'Develop new features and improvements')}</li>
                <li>{t('legal.privacy.usage.items.communication', 'Send service updates and marketing communications (with consent)')}</li>
                <li>{t('legal.privacy.usage.items.compliance', 'Comply with legal obligations')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.gdpr.title', '4. GDPR Rights')}</h2>
              <p>{t('legal.privacy.gdpr.content', 'Under GDPR, you have the right to:')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('legal.privacy.gdpr.items.access', 'Access your personal data')}</li>
                <li>{t('legal.privacy.gdpr.items.rectification', 'Correct inaccurate data')}</li>
                <li>{t('legal.privacy.gdpr.items.erasure', 'Request deletion of your data')}</li>
                <li>{t('legal.privacy.gdpr.items.portability', 'Data portability')}</li>
                <li>{t('legal.privacy.gdpr.items.objection', 'Object to data processing')}</li>
                <li>{t('legal.privacy.gdpr.items.withdraw', 'Withdraw consent at any time')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.security.title', '5. Data Security')}</h2>
              <p>{t('legal.privacy.security.content', 'We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your data from unauthorized access.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.cookies.title', '6. Cookies')}</h2>
              <p>{t('legal.privacy.cookies.content', 'We use cookies to improve your experience. You can control cookies through your browser settings. Essential cookies are required for the service to function.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.retention.title', '7. Data Retention')}</h2>
              <p>{t('legal.privacy.retention.content', 'We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your data at any time.')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legal.privacy.contact.title', '8. Contact Us')}</h2>
              <p>{t('legal.privacy.contact.content', 'For privacy-related questions or to exercise your rights, please contact us at:')} privacy@thetradingdiary.com</p>
            </section>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
