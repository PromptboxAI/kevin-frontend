// Legal hub — Privacy + Terms in one document with a tab switcher

const { KevinWordmark, Icon, I } = window;

const TABS = [
  { id: 'privacy',  label: 'Privacy Policy',     date: 'Effective May 1, 2026' },
  { id: 'terms',    label: 'Terms of Service',   date: 'Effective May 1, 2026' },
  { id: 'dpa',      label: 'Data Processing Addendum', date: 'Effective Mar 12, 2026' },
  { id: 'security', label: 'Security & Compliance', date: 'AES-256 · TLS 1.3 · Audit log v2026' },
];

const SECTIONS = [
  ['intro',        '1 · Introduction',                'Kevin.co, LLC ("Kevin", "we", "us") provides software that helps insurance adjusters and estate liquidators build personal-property inventories from photographs. This Privacy Policy describes what information we collect, how we use it, and the choices you have. We are based in Long Island, New York, and operate exclusively in the United States.'],
  ['collect',      '2 · Information we collect',      'We collect three categories of information: (a) account information — your name, agency, work email, and authentication credentials; (b) claim content — photographs you upload, claim metadata you enter, and inventories Kevin generates from your photographs; (c) usage data — log entries, IP address, browser type, and timestamps to operate and secure the service. We do not collect personal data about claimants or insured parties beyond what you choose to enter.'],
  ['use',          '3 · How we use information',      'Account information is used to authenticate you, bill you, and contact you about your account. Claim content is used solely to provide the service to you: identifying items, fetching pricing comparisons, generating exports. Claim content is never used to train general-purpose AI models. Usage data is used for security monitoring, debugging, and product improvement in aggregate.'],
  ['share',        '4 · Sharing',                     'We share information with: cloud-infrastructure providers (AWS · us-east-2) under contract; pricing-data providers (retailer APIs) to fetch comparison prices for items you upload; legal authorities when required by law. We do not sell your information. We do not allow advertising networks on this site.'],
  ['retention',    '5 · Retention',                   'Claim content is retained while your account is active and for 7 years afterward, matching insurance-industry record-keeping norms. You can delete a specific claim at any time, which removes it from active storage within 24 hours and from backups within 90 days. Account information is retained while the account is active; deleting your account removes account information within 30 days, except where retention is required by law.'],
  ['rights',       '6 · Your rights',                 'You have the right to access, correct, export, and delete your personal information. Account owners can do all of this from Settings → My profile. For California residents (CCPA/CPRA) and EU/UK residents (GDPR) we honor the additional rights afforded by those laws, including the right to know and the right to non-discrimination. Contact kevin@kevin.co with any request.'],
  ['security',     '7 · Security',                    'Kevin encrypts data in transit (TLS 1.3) and at rest (AES-256). Access to production systems requires MFA. We segregate customer data by tenant. We run penetration tests quarterly. Read our Security & Compliance page for current attestations.'],
  ['children',     '8 · Children',                    'Kevin is a B2B product not intended for use by individuals under 18. We do not knowingly collect personal information from children.'],
  ['changes',      '9 · Changes',                     'When we make material changes to this policy we notify account owners by email at least 14 days before the change takes effect. The "Effective" date above reflects the most recent material revision. We maintain prior versions in our public changelog at kevin.co/legal/changelog.'],
  ['contact',      '10 · Contact',                    'Privacy and security questions: kevin@kevin.co · Postal: Kevin.co, LLC · 34 E. Main St. Ste 347, Smithtown, NY 11787 · United States.'],
];

// Terms of Service. Note §4 — the valuation disclaimer lives HERE, not stamped on
// every exported PDF (stakeholder decision).
const TERMS_SECTIONS = [
  ['t-agree',    '1 · Agreement',                  'These Terms of Service govern your use of Kevin, provided by Kevin.co, LLC ("Kevin", "we", "us"). By creating an account or using the service you agree to them. If you are accepting on behalf of a company or agency, you represent that you have authority to bind that entity.'],
  ['t-service',  '2 · What the service does',      'Kevin is software that helps you build personal-property inventories from photographs. It identifies items, suggests a content class, retrieves retail and comparable-sale pricing, calculates suggested depreciation, and produces exports — including a spreadsheet formatted for import into Xactimate/XactContents and a printable PDF inventory. Kevin produces a working document for you to review; it does not submit anything to a carrier on your behalf.'],
  ['t-accounts', '3 · Your account and your data',  'You are responsible for the accuracy of what you enter and for safeguarding your credentials. Your claims and photographs are yours: you may archive, export, or permanently delete any claim at any time, and archived claims remain accessible to you. You are responsible for having the right to upload the photographs and information you submit.'],
  ['t-valuation','4 · Valuation disclaimer — not an appraisal', 'Kevin is a pricing-research and documentation tool, not an appraisal service. Values Kevin produces are estimates compiled from publicly available retailer listings, comparable sales, and the depreciation schedule you select. They are NOT a certified appraisal, and Kevin is not acting as a licensed or certified appraiser, adjuster, broker, or valuation expert. No opinion of value is being rendered. Items in categories that customarily require a qualified appraisal — including jewelry, fine art, firearms, furs, antiques, and collectibles — are deliberately left unpriced for you to value or refer out. You are the professional of record: every figure is presented for your review, and you are solely responsible for the values you accept, adjust, and submit. Kevin makes no representation that any estimate will be accepted by an insurer, a court, a taxing authority, or any other party.'],
  ['t-conduct',  '5 · Acceptable use',              'Do not use Kevin to build inventories you know to be false, to upload content you lack rights to, to reverse-engineer or resell the service, to circumvent rate limits, or to scrape pricing data for redistribution. Do not use the service to violate applicable law. We may suspend accounts that put the platform or its pricing-data relationships at risk.'],
  ['t-resp',     '6 · Professional responsibility', 'You are solely responsible for your own licensing, professional standards, carrier and client agreements, record-keeping obligations, and any internal rules that apply to your work. Kevin does not monitor or enforce those obligations, and providing the service does not make us a party to your engagement with any carrier, insured, client, or estate.'],
  ['t-fees',     '7 · Fees and billing',            'Pro is billed as a flat monthly subscription with unlimited claims and an allowance of 2,000 line items per billing month, with additional items charged at $0.20 each on the following invoice, preceded by a free tier of 250 line items with no time limit; the subscription begins when you choose to start it, or when your account passes the free item allowance. Enterprise is billed under a separate order form. Subscriptions renew automatically until cancelled, and cancellation takes effect at the end of the current billing period. Fees are non-refundable except where required by law. We will give at least 30 days’ notice by email before changing the price of an active subscription.'],
  ['t-ip',       '8 · Intellectual property',       'Kevin and everything in it — software, interface, data models, depreciation logic — remain our property. You keep all rights to your claim content. You grant us only the limited license needed to host, process, and display that content in order to provide the service to you. We do not use your claim content to train general-purpose AI models.'],
  ['t-third',    '9 · Third-party data and services','Pricing comparisons come from third-party retailers, aggregators, and resale marketplaces. That data is theirs, may change without notice, and may be incomplete or in error. Xactimate and XactContents are products of Verisk; Kevin is not affiliated with, endorsed by, or partnered with Verisk or with any insurance carrier. Carrier names appear only to identify claim metadata you enter.'],
  ['t-warranty', '10 · Disclaimer of warranties',   'The service is provided "as is" and "as available." To the fullest extent permitted by law we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, and any warranty as to the accuracy or completeness of identifications, prices, depreciation figures, or exports.'],
  ['t-liability','11 · Limitation of liability',    'To the fullest extent permitted by law, neither party is liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost claims revenue, or reputational harm. Our total aggregate liability arising out of or relating to the service is limited to the fees you paid us in the twelve months preceding the event giving rise to the claim.'],
  ['t-indemnity','12 · Indemnity',                  'You agree to indemnify and hold Kevin harmless from third-party claims arising out of your use of the service, the content you upload, the values you submit, or your breach of these Terms — including claims brought by an insurer, insured, client, estate, or regulator relating to an inventory you prepared.'],
  ['t-term',     '13 · Suspension and termination', 'You may cancel at any time from Settings → Billing. We may suspend or terminate for non-payment, for material breach, or if required by law. On termination you keep the ability to export your data for 30 days, after which retention follows the schedule in our Privacy Policy.'],
  ['t-law',      '14 · Governing law and disputes', 'These Terms are governed by the laws of the State of New York, without regard to conflict-of-laws rules. The state and federal courts located in Nassau County, New York have exclusive jurisdiction, and both parties consent to venue there. Each party waives any right to a jury trial.'],
  ['t-changes',  '15 · Changes to these Terms',     'We may update these Terms. For material changes we notify account owners by email at least 14 days before they take effect, and continued use after that date constitutes acceptance. Prior versions are kept in our public changelog at kevin.co/legal/changelog.'],
  ['t-contact',  '16 · Contact',                    'Questions about these Terms: kevin@kevin.co · Kevin.co, LLC · 34 E. Main St. Ste 347, Smithtown, NY 11787 · United States.'],
];

const SEC_SECTIONS = [
  ['s-encrypt',  '1 · Encryption',            'All customer data is encrypted with AES-256 at rest and TLS 1.3 in transit. Claim photographs and exports are stored in access-controlled buckets with signed, expiring URLs — nothing is served from a public path.'],
  ['s-access',   '2 · Access control',        'Production access requires MFA and is limited to named engineers with a logged reason. Customer data is segregated by tenant; no cross-account queries are possible from the application layer.'],
  ['s-audit',    '3 · Audit trail',           'Every change to a claim — prices, classes, ages, overrides, exports — is recorded with who, what, and when. The audit trail is append-only and rides with the claim for its lifetime.'],
  ['s-infra',    '4 · Infrastructure',        'Kevin runs on U.S.-region cloud infrastructure with automated patching, isolated build pipelines, and no customer data in development or staging environments.'],
  ['s-payments', '5 · Payments',              'Card processing is handled by our payment processor; card numbers never touch Kevin\u2019s servers. We store only the billing metadata needed for invoices.'],
  ['s-backups',  '6 · Backups & recovery',    'Data is backed up continuously with point-in-time recovery. Backups are encrypted with the same standard as production data.'],
  ['s-disclose', '7 · Responsible disclosure', 'Found a vulnerability? Email kevin@kevin.co with reproduction steps. We acknowledge within 2 business days and do not pursue good-faith researchers.'],
  ['s-posture',  '8 · Certifications',        'We describe our controls concretely rather than by acronym. Ask us anything specific — kevin@kevin.co — and we\u2019ll answer with the actual practice, not a badge.'],
];

const LegalHub = () => {
  const [tab, setTab] = React.useState(() => {
    const h = (typeof location !== 'undefined' && location.hash || '').slice(1);
    return TABS.some(x => x.id === h) ? h : 'privacy';
  });
  const t = TABS.find(x => x.id === tab) || TABS[0];
  const secs = tab === 'terms' ? TERMS_SECTIONS : tab === 'security' ? SEC_SECTIONS : SECTIONS;

  return (
    <div className="k-docs">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark href="02-Landing.html" size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <span style={{ fontSize: 13, color: 'var(--k-fg-2)' }}>Legal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="k-btn k-btn--ghost"><Icon d={I.download} size={12}/> Download PDF</button>
          <button className="k-btn k-btn--ghost">Print</button>
        </div>
      </header>

      <div className="k-legal-body">
        {/* — Hero — */}
        <div className="k-legal-hero">
          <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 44, letterSpacing: '-0.028em', margin: '8px 0 12px', lineHeight: 1.05 }}>
            We hold claim data the way you'd want a doctor to hold a chart.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: 0, maxWidth: 640 }}>
            Here's what that means in writing — and the security work behind it.
          </p>
        </div>

        {/* — Tab switcher — */}
        <div className="k-legal-tabs">
          {TABS.map(x => (
            <button key={x.id} onClick={() => setTab(x.id)} className={`k-legal-tab ${x.id === tab ? 'k-legal-tab--on' : ''}`}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{x.label}</div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 3, fontFamily: 'var(--k-font-mono)' }}>{x.date}</div>
            </button>
          ))}
        </div>

        <div className="k-legal-doc">
          {/* — Document body — */}
          <article className="k-legal-article">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 30, letterSpacing: '-0.022em', margin: 0 }}>
                {t.label}
              </h2>
              <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{t.date} · v2026.05</span>
            </div>

            {secs.map(([id, h, body]) => (
              <section key={id} id={id} className="k-legal-section">
                <h3 className="k-legal-h3">{h}</h3>
                <p className="k-legal-p">{body}</p>
              </section>
            ))}

            <div style={{ marginTop: 32, padding: 18, background: 'var(--k-bg-2)', border: '1px solid var(--k-line)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Plain-language summary</div>
              <div style={{ fontSize: 13, color: 'var(--k-fg-2)', marginTop: 6, lineHeight: 1.55 }}>
                We collect what we need to operate the service, we don't sell anything, we don't train models on your claims, we encrypt everything, and you can leave at any time with all your data. If a clause above contradicts that summary, the summary is what we meant.
              </div>
            </div>
          </article>

          {/* — TOC rail — */}
          <aside className="k-legal-rail">
            <div className="k-docs-rail-h">Sections</div>
            {secs.map(([id, h]) => (
              <a key={id} href={`#${id}`} className="k-docs-rail-item">{h.replace(/^\d+\s·\s/, '')}</a>
            ))}
            <div className="k-docs-rail-meta">
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>Have a question?</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11.5 }}>
                <button className="k-link">kevin@kevin.co</button>
              </div>
              <div style={{ marginTop: 14, fontSize: 11, color: 'var(--k-fg-4)' }}>Prior versions are kept in our <a className="k-link">public changelog</a>.</div>
            </div>
          </aside>
        </div>
      </div>
      {/* Public page (/legal). The page holding Privacy and Terms had no way
          back out to anywhere else. */}
      <window.MktFooter />
    </div>
  );
};

window.LegalHub = LegalHub;
