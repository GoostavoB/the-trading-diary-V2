import { PremiumCard } from '@/components/ui/PremiumCard';
import AppLayout from '@/components/layout/AppLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslation } from '@/hooks/useTranslation';
import { SkipToContent } from '@/components/SkipToContent';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';

const FAQ = () => {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('faq.questions.whatIsJournal.question'),
      answer: t('faq.questions.whatIsJournal.answer')
    },
    {
      question: t('faq.questions.howHelps.question'),
      answer: t('faq.questions.howHelps.answer')
    },
    {
      question: t('faq.questions.assetTypes.question'),
      answer: t('faq.questions.assetTypes.answer')
    },
    {
      question: t('faq.questions.security.question'),
      answer: t('faq.questions.security.answer')
    },
    {
      question: t('faq.questions.metrics.question'),
      answer: t('faq.questions.metrics.answer')
    }
  ];

  return (
    <>
      <SEO
        title={pageMeta.faqPage.title}
        description={pageMeta.faqPage.description}
        keywords={pageMeta.faqPage.keywords}
        canonical={pageMeta.faqPage.canonical}
      />
      <AppLayout>
      <SkipToContent />
      <main id="main-content" className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl md:text-4xl text-gradient-electric-soft" id="faq-heading">{t('faq.title')}</h1>
          <p className="text-sm text-space-300">{t('faq.subtitle')}</p>
        </header>

        <PremiumCard className="card-premium p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-space-500/40">
                <AccordionTrigger className="text-left text-space-100">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-space-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </PremiumCard>
      </main>
    </AppLayout>
    </>
  );
};

export default FAQ;
