import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';

export default function CookiePolicy() {
  return (
    <>
      <SEO
        title={pageMeta.cookiePolicy.title}
        description={pageMeta.cookiePolicy.description}
        keywords={pageMeta.cookiePolicy.keywords}
        canonical={pageMeta.cookiePolicy.canonical}
      />
      <AppLayout>
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
              <p>
                Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is
                stored in your web browser and allows the Service or a third-party to recognize you and make your
                next visit easier and the Service more useful to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
              <p>
                When you use and access the Service, we may place a number of cookie files in your web browser.
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To enable certain functions of the Service</li>
                <li>To provide analytics</li>
                <li>To store your preferences</li>
                <li>To enable authentication and security features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>

              <h3 className="text-xl font-semibold mb-3">Essential Cookies</h3>
              <p>
                These cookies are essential for you to browse the website and use its features, such as accessing
                secure areas of the site. Without these cookies, services you have asked for cannot be provided.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">Analytics Cookies</h3>
              <p>
                These cookies collect information about how visitors use a website, for instance which pages visitors
                go to most often. These cookies don't collect information that identifies a visitor.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">Functionality Cookies</h3>
              <p>
                These cookies allow the website to remember choices you make and provide enhanced, more personal features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
              <p>
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics
                of the Service and deliver advertisements on and through the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Your Choices Regarding Cookies</h2>
              <p>
                If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit
                the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept
                them, you might not be able to use all of the features we offer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
              <p>
                If you have any questions about our use of cookies, please contact us at privacy@thetradingdiary.com
              </p>
            </section>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
