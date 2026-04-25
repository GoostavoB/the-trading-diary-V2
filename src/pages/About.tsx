import AppLayout from '@/components/layout/AppLayout';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { useTranslation } from '@/hooks/useTranslation';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/utils/languageRouting';
import { Target, Users, TrendingUp, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HreflangLinks } from '@/components/HreflangLinks';

const About = () => {
  const { t, changeLanguage } = useTranslation();
  const navigate = useNavigate();

  // Sync language with URL
  useEffect(() => {
    const pathLang = window.location.pathname.split('/')[1];
    if (['pt', 'es', 'ar', 'vi'].includes(pathLang)) {
      changeLanguage(pathLang as SupportedLanguage);
    }
  }, [changeLanguage]);

  return (
    <AppLayout>
      <HreflangLinks languages={[...SUPPORTED_LANGUAGES]} defaultLanguage="en" />
      <SEO
        title={t('about.title', 'About Us - The Trading Diary')}
        description={t('about.pageDescription', 'Learn about The Trading Diary team and our mission to help crypto traders improve their performance with AI-powered analytics and insights.')}
        canonical="https://www.thetradingdiary.com/about"
        keywords="about us, trading diary team, crypto trading tools, mission"
      />
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="font-display text-4xl md:text-5xl text-gradient-electric">
            {t('about.title', 'About The Trading Diary')}
          </h1>
          <p className="text-lg text-space-300 max-w-2xl mx-auto">
            {t('about.subtitle', 'Empowering crypto traders with AI-powered insights and analytics')}
          </p>
        </header>

        {/* Mission */}
        <PremiumCard className="card-premium p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-ios-card">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-gradient-electric-soft mb-3">{t('about.mission.title', 'Our Mission')}</h2>
              <p className="text-space-300 leading-relaxed">
                {t('about.mission.description', 'We believe that successful trading isn\'t about luck—it\'s about data, discipline, and continuous improvement. The Trading Diary was built to help crypto traders track every trade, analyze patterns, and make better decisions through AI-powered insights. Our mission is to make professional-grade trading analytics accessible to everyone, from beginners to experienced traders.')}
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* Team */}
        <PremiumCard className="card-premium p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-ios-card">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-gradient-electric-soft mb-3">{t('about.team.title', 'Our Team')}</h2>
              <p className="text-space-300 leading-relaxed mb-4">
                {t('about.team.description1', 'We\'re a team of experienced crypto traders, data scientists, and software engineers who\'ve been in your shoes. We\'ve experienced the frustration of tracking trades manually, struggling to identify patterns, and making emotional decisions without data to back them up.')}
              </p>
              <p className="text-space-300 leading-relaxed">
                {t('about.team.description2', 'Our team brings together decades of combined experience in cryptocurrency trading, machine learning, and fintech product development. We\'ve traded through bull markets and bear markets, and we\'ve built The Trading Diary with the features we wished we had when we started.')}
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* What We Offer */}
        <PremiumCard className="card-premium p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-ios-card">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-gradient-electric-soft mb-3">{t('about.features.title', 'What We Offer')}</h2>
              <ul className="space-y-3 text-space-300">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong className="text-space-100">{t('about.features.trade.title', 'Automated Trade Import:')}</strong> {t('about.features.trade.description', 'Connect with major exchanges and import trades seamlessly')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong className="text-space-100">{t('about.features.ai.title', 'AI-Powered Analytics:')}</strong> {t('about.features.ai.description', 'Get actionable insights from your trading patterns')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong className="text-space-100">{t('about.features.performance.title', 'Performance Tracking:')}</strong> {t('about.features.performance.description', 'Monitor your progress with comprehensive dashboards')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong className="text-space-100">{t('about.features.risk.title', 'Risk Management:')}</strong> {t('about.features.risk.description', 'Tools to help you manage position sizing and risk')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong className="text-space-100">{t('about.features.psychology.title', 'Trading Psychology:')}</strong> {t('about.features.psychology.description', 'Track emotional patterns and improve discipline')}</span>
                </li>
              </ul>
            </div>
          </div>
        </PremiumCard>

        {/* Security & Privacy */}
        <PremiumCard className="card-premium p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-ios-card">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-gradient-electric-soft mb-3">{t('about.security.title', 'Security & Privacy')}</h2>
              <p className="text-space-300 leading-relaxed mb-4">
                {t('about.security.description1', 'Your trading data is highly sensitive, and we treat it as such. We use enterprise-grade encryption for all data in transit and at rest. We never store your exchange API keys in plain text, and we never access your accounts directly.')}
              </p>
              <p className="text-space-300 leading-relaxed">
                {t('about.security.description2', 'Your data belongs to you. You can export it at any time, and you can delete your account permanently whenever you want. We\'re committed to transparency and user control over personal information.')}
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* Join Us */}
        <section className="text-center py-8" aria-labelledby="about-cta-heading">
          <h2 id="about-cta-heading" className="font-display text-3xl text-gradient-electric-soft mb-4">{t('about.cta.title', 'Join Thousands of Traders')}</h2>
          <p className="text-sm text-space-300 mb-6">
            {t('about.cta.subtitle', 'Start tracking your trades and improving your performance today')}
          </p>
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="btn-primary"
            aria-label="Get started with The Trading Diary for free"
          >
            {t('about.cta.button', 'Get Started Free')}
          </Button>
        </section>
      </div>
    </AppLayout>
  );
};

export default About;
