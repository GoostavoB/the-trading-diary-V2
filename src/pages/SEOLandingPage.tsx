import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { MobileHeader } from '@/components/MobileHeader';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { ArrowRight, CheckCircle, BookOpen, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getSEOPageBySlug, getRelatedSEOPages } from '@/data/seoLandingPages';
import { useEffect } from 'react';
import { addStructuredData, generateHowToSchema, generateFAQSchema, generateArticleSchema } from '@/utils/seoHelpers';

export default function SEOLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? getSEOPageBySlug(slug) : null;
  const relatedPages = slug ? getRelatedSEOPages(slug, 4) : [];

  useEffect(() => {
    if (!page) return;

    // Add structured data based on content type
    if (page.contentType === 'How-To Guide' && page.content.sections.length > 0) {
      addStructuredData(
        generateHowToSchema(
          page.h1,
          page.metaDescription,
          page.content.sections.map((section, index) => ({
            stepNumber: index + 1,
            stepName: section.heading,
            stepDescription: section.content,
          }))
        )
      );
    }

    if (page.faqItems && page.faqItems.length > 0) {
      addStructuredData(
        generateFAQSchema(
          page.faqItems.map(item => ({
            question: item.question,
            answer: item.answer,
          }))
        )
      );
    }

    // Add Article schema for all content types
    addStructuredData(
      generateArticleSchema({
        headline: page.title,
        description: page.metaDescription,
        image: 'https://www.thetradingdiary.com/og-image-en.png',
        datePublished: '2025-01-10',
        dateModified: new Date().toISOString().split('T')[0],
        authorName: 'TheTradingDiary Team',
      })
    );
  }, [page]);

  if (!page) {
    return <Navigate to="/404" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.metaDescription} />
        <meta name="keywords" content={page.focusKeyword} />
        <link rel="canonical" href={`https://www.thetradingdiary.com/${page.slug}`} />

        {/* Open Graph */}
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.metaDescription} />
        <meta property="og:url" content={`https://www.thetradingdiary.com/${page.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://www.thetradingdiary.com/og-image-en.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        <meta name="twitter:description" content={page.metaDescription} />
        <meta name="twitter:image" content="https://www.thetradingdiary.com/og-image-en.png" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <SkipToContent />
        <MobileHeader />

        <main id="main-content" className="pt-20 pb-16">
          {/* Hero Section */}
          <section className="px-4 py-16 md:py-24">
            <div className="container max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block px-4 py-2 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {page.category} • {page.contentType}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  {page.h1}
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                  {page.content.introduction}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth">
                    <Button size="lg" className="w-full sm:w-auto">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content Sections */}
          <section className="px-4 py-12">
            <div className="container max-w-4xl mx-auto">
              <div className="space-y-12">
                {page.content.sections.map((section, index) => (
                  <Card key={index} className="glass-strong border-primary/20">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                          {index === 0 && <BookOpen className="h-6 w-6" />}
                          {index === 1 && <TrendingUp className="h-6 w-6" />}
                          {index === 2 && <BarChart3 className="h-6 w-6" />}
                          {index > 2 && <CheckCircle className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-2xl mb-3">{section.heading}</CardTitle>
                          <CardDescription className="text-base text-gray-300">
                            {section.content}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-4 py-16 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20">
            <div className="container max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Trading?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                {page.content.conclusion}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          {page.faqItems && page.faqItems.length > 0 && (
            <section className="px-4 py-16">
              <div className="container max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center">
                  Frequently Asked Questions
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {page.faqItems.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="glass-strong border-primary/20 px-6 rounded-lg">
                      <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-300 text-base">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          )}

          {/* Related Pages */}
          {relatedPages.length > 0 && (
            <section className="px-4 py-16">
              <div className="container max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center">
                  Related Resources
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedPages.map((relatedPage) => (
                    <Link key={relatedPage.slug} to={`/${relatedPage.slug}`}>
                      <Card className="h-full glass-strong border-primary/20 hover:border-primary/40 transition-all hover:scale-105">
                        <CardHeader>
                          <CardTitle className="text-lg">{relatedPage.h1}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {relatedPage.metaDescription}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <span className="text-sm text-primary font-medium">
                            Learn more →
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Internal Links Section */}
          {page.relatedLinks && page.relatedLinks.length > 0 && (
            <section className="px-4 py-12 bg-gray-900/50">
              <div className="container max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  Helpful Tools & Resources
                </h3>
                <div className="flex flex-wrap gap-4 justify-center">
                  {page.relatedLinks.map((link, index) => (
                    <Link key={index} to={link}>
                      <Button variant="outline" size="sm">
                        {link === '/' && 'Home'}
                        {link.includes('position-size') && 'Position Size Calculator'}
                        {link.includes('win-rate') && 'Win Rate Tracker'}
                        {link.includes('weekly-trade-review') && 'Weekly Review Guide'}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
