import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumCard } from "@/components/ui/PremiumCard";
import AppLayout from "@/components/layout/AppLayout";
import { SEO } from '@/components/SEO';
import { useTranslation } from "@/hooks/useTranslation";
import { Shield, FileText, AlertCircle } from "lucide-react";

const Legal = () => {
  const { t } = useTranslation();

  return (
    <>
    <SEO
      title="Legal - The Trading Diary"
      description="Legal information for The Trading Diary including terms of service, privacy policy, and cookie policy."
      canonical="https://www.thetradingdiary.com/legal"
    />
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">{t('legal.title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('legal.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('legal.termsTitle')}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('legal.privacyTitle')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="mt-6">
            <PremiumCard className="p-8 space-y-6 bg-card/50 backdrop-blur-sm">
              {/* Beta Notice */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">{t('legal.betaNotice')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('legal.betaDescription')}
                  </p>
                </div>
              </div>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.terms.acceptance.title')}</h2>
                <p className="text-muted-foreground">{t('legal.terms.acceptance.content')}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.terms.service.title')}</h2>
                <p className="text-muted-foreground mb-3">{t('legal.terms.service.content')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>{t('legal.terms.service.features.trading')}</li>
                  <li>{t('legal.terms.service.features.analytics')}</li>
                  <li>{t('legal.terms.service.features.ai')}</li>
                  <li>{t('legal.terms.service.features.social')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.terms.accounts.title')}</h2>
                <p className="text-muted-foreground">{t('legal.terms.accounts.content')}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.terms.payment.title')}</h2>
                <p className="text-muted-foreground mb-3">{t('legal.terms.payment.content')}</p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-semibold text-sm mb-2">{t('legal.terms.payment.refundPolicy')}</p>
                  <p className="text-sm text-muted-foreground">{t('legal.terms.payment.refundDetails')}</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.terms.disclaimer.title')}</h2>
                <p className="text-muted-foreground">{t('legal.terms.disclaimer.content')}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.terms.termination.title')}</h2>
                <p className="text-muted-foreground">{t('legal.terms.termination.content')}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.terms.changes.title')}</h2>
                <p className="text-muted-foreground">{t('legal.terms.changes.content')}</p>
              </section>

              <section className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {t('legal.lastUpdated')}: {new Date().toLocaleDateString()}
                </p>
              </section>
            </PremiumCard>
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <PremiumCard className="p-8 space-y-6 bg-card/50 backdrop-blur-sm">
              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.privacy.intro.title')}</h2>
                <p className="text-muted-foreground">{t('legal.privacy.intro.content')}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.privacy.collection.title')}</h2>
                <p className="text-muted-foreground mb-3">{t('legal.privacy.collection.content')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>{t('legal.privacy.collection.items.account')}</li>
                  <li>{t('legal.privacy.collection.items.trading')}</li>
                  <li>{t('legal.privacy.collection.items.usage')}</li>
                  <li>{t('legal.privacy.collection.items.technical')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.privacy.usage.title')}</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>{t('legal.privacy.usage.items.service')}</li>
                  <li>{t('legal.privacy.usage.items.analytics')}</li>
                  <li>{t('legal.privacy.usage.items.improvements')}</li>
                  <li>{t('legal.privacy.usage.items.communication')}</li>
                  <li>{t('legal.privacy.usage.items.compliance')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.privacy.gdpr.title')}</h2>
                <p className="text-muted-foreground mb-3">{t('legal.privacy.gdpr.content')}</p>
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">{t('legal.privacy.gdpr.rights.access')}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">{t('legal.privacy.gdpr.rights.rectification')}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">{t('legal.privacy.gdpr.rights.erasure')}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">{t('legal.privacy.gdpr.rights.portability')}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">{t('legal.privacy.gdpr.rights.objection')}</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.privacy.security.title')}</h2>
                <p className="text-muted-foreground">{t('legal.privacy.security.content')}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.privacy.sharing.title')}</h2>
                <p className="text-muted-foreground">{t('legal.privacy.sharing.content')}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.privacy.cookies.title')}</h2>
                <p className="text-muted-foreground">{t('legal.privacy.cookies.content')}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">{t('legal.privacy.contact.title')}</h2>
                <p className="text-muted-foreground mb-2">{t('legal.privacy.contact.content')}</p>
                <a href="mailto:privacy@thetradingdiary.com" className="text-primary hover:underline font-medium">
                  privacy@thetradingdiary.com
                </a>
              </section>

              <section className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {t('legal.lastUpdated')}: {new Date().toLocaleDateString()}
                </p>
              </section>
            </PremiumCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
    </>
  );
};

export default Legal;
