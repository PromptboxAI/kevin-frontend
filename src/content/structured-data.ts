/**
 * Site-level structured data, rendered by <Seo> on the homepage.
 *
 * Only facts the site already states in plain view: the legal name, address
 * and email are the footer's, the price is the pricing page's. No ratings and
 * no review counts — there are none, and markup that describes something a
 * visitor cannot see on the page is what earns a manual action.
 *
 * The pricing FAQ is NOT here. It is built in PricingPage from the same FAQS
 * array the page renders, so the markup cannot say something the page stopped
 * saying — which is exactly how the prototype's copy drifted (design/SEO.md).
 */
import { ORIGIN, SEO_PAGES } from './seo-pages'

export const SITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${ORIGIN}/#organization`,
      name: 'Kevin',
      legalName: 'Kevin.co, LLC',
      url: ORIGIN,
      logo: `${ORIGIN}/favicon.svg`,
      email: 'kevin@kevin.co',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '34 E. Main St. Ste 347',
        addressLocality: 'Smithtown',
        addressRegion: 'NY',
        postalCode: '11787',
        addressCountry: 'US',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${ORIGIN}/#website`,
      name: 'Kevin',
      url: ORIGIN,
      publisher: { '@id': `${ORIGIN}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Kevin',
      url: ORIGIN,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: SEO_PAGES['/'].description,
      publisher: { '@id': `${ORIGIN}/#organization` },
      offers: {
        '@type': 'Offer',
        name: 'Pro',
        price: '249.00',
        priceCurrency: 'USD',
        url: `${ORIGIN}/pricing`,
      },
    },
  ],
}
