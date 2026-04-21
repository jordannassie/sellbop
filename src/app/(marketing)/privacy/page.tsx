import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — SellBop.com',
  description: 'SellBop Privacy Policy — how we collect, use, and protect your personal information.',
}

const SECTIONS = [
  { id: 'scope',        label: '1. Scope' },
  { id: 'data-types',  label: '2. Types of Data We Collect' },
  { id: 'cookies',     label: '3. Cookies & Similar Technologies' },
  { id: 'use',         label: '4. Use of Your Personal Data' },
  { id: 'disclosure',  label: '5. Our Disclosure of Your Personal Data' },
  { id: 'protection',  label: '6. Account Protection' },
  { id: 'choices',     label: '7. Your Choices' },
  { id: 'security',    label: '8. Security' },
  { id: 'transfers',   label: '9. International Transfers' },
  { id: 'third-party', label: '10. Third Parties' },
  { id: 'changes',     label: '11. Changes to this Policy' },
  { id: 'google',      label: '12. Google User Data' },
  { id: 'contact',     label: '13. Contact Us' },
  { id: 'eu',          label: '14. EU Users' },
]

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-lg font-bold text-black mt-10 mb-3 scroll-mt-20">{children}</h2>
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-black mt-5 mb-2">{children}</h3>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-neutral-700 leading-relaxed mb-3">{children}</p>
}
function UL({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-outside ml-5 space-y-1.5 mb-3">
      {items.map((item, i) => <li key={i} className="text-sm text-neutral-700 leading-relaxed">{item}</li>)}
    </ul>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-black mb-2">Privacy Policy</h1>
          <p className="text-sm text-neutral-500">Last updated: April 2025</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* TOC sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Contents</p>
              <nav className="space-y-1">
                {SECTIONS.map(s => (
                  <a key={s.id} href={`#${s.id}`} className="block text-xs text-neutral-500 hover:text-black transition-colors py-0.5 leading-tight">
                    {s.label}
                  </a>
                ))}
              </nav>
              <div className="mt-6 pt-4 border-t border-neutral-100">
                <Link href="/terms" className="text-xs text-neutral-400 hover:text-black transition-colors">Terms of Service →</Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 min-w-0">

            <H2 id="scope">1. Scope</H2>
            <P>This Privacy Policy describes how SellBop, Inc. ("SellBop," "we," "us") handles your personal information for our Service on the SellBop websites, tools, and mobile applications. It applies generally to information collected on the SellBop.com website and mobile applications (collectively, the "Site") or through the use of our Service.</P>

            <H2 id="data-types">2. Types of Data We Collect</H2>
            <P>We may collect and store the following Personal Data:</P>

            <H3>Information You Provide to Us</H3>
            <UL items={[
              'Contact information, such as name, user ID, e-mail address, and phone number',
              'Information necessary for us to remit payments to sellers, such as financial account transactional information based on your activities on the Site as a seller',
              'Marketing information, such as your preferences for receiving marketing communications',
              'Community discussions, chats, dispute resolution, correspondence through our Site',
              'Other personal information you choose to submit to us',
            ]} />

            <H3>Information We Collect About Buyers From or on Behalf of Our Sellers</H3>
            <UL items={[
              'Transactional information based on your activities on the Site as a buyer (such as items and content you purchase)',
              'Payment information, such as credit card number',
              'Your contact information, including name, user ID, email address, and shipping or billing information',
              'Other personal information that our sellers may provide about you',
            ]} />

            <H3>Information Automatically Collected</H3>
            <P>Your computer or mobile device operating system type and version number, manufacturer and model, device identifier, browser type, screen resolution, IP address, the website you visited before browsing to our Site, general location information, and information about your use of and actions on our Sites, such as pages you viewed, how long you spent on a page, and navigation paths between pages. This information is collected using cookies and similar technologies.</P>

            <H3>Social Media Networks and Other Third-Party Platforms</H3>
            <P>We may offer single sign-on services that allow you to use third-party login credentials to sign into our Service. With your permission, SellBop may also collect profile information contained in your third-party profile. We may also maintain pages for our company and products on third-party platforms such as Facebook, Twitter, YouTube, and Instagram. When you interact with our pages on those third-party platforms, the third-party's privacy policy will govern your interactions.</P>

            <H3>Sensitive Personal Information</H3>
            <P>If you send or disclose any sensitive personal information to us when you use the Services, you must consent to our processing and use of such sensitive personal information in accordance with this Privacy Policy.</P>

            <H2 id="cookies">3. Cookies & Similar Technologies</H2>
            <H3>What are cookies?</H3>
            <P>Cookies are small data files stored on your computer or mobile device by a website. Our Sites may use both session cookies (which expire once you close your web browser) and persistent cookies (which stay on your computer or mobile device until you delete them).</P>

            <H3>Cookies we use</H3>
            <UL items={[
              'Essential Cookies — required to provide services available through our Site.',
              'Functionality Cookies — allow our Sites to remember choices you make, providing a more personal experience.',
              'Analytics and Performance Cookies — collect information about traffic and how individuals use our Sites, to help us operate the Site more efficiently.',
              'Social Media Cookies — used when you share information using a social media sharing button or link your account with social networks.',
              'Targeted and Advertising Cookies — track your browsing habits to enable advertising networks to deliver ads that may be of interest to you.',
            ]} />

            <H3>Disabling cookies</H3>
            <P>You can typically remove or reject cookies via your browser settings. If you do not accept our cookies, you may experience some inconvenience in your use of our Site, such as needing to log in every time you visit.</P>

            <H2 id="use">4. Use of Your Personal Data</H2>
            <H3>To provide our Sites and Services</H3>
            <UL items={[
              'Facilitate the creation of and secure your account on our network',
              'Identify you as a User in the system',
              'Send you a welcome e-mail to verify ownership of the e-mail address provided when your account was created',
              'Provide the Service and customer support you request',
              'Resolve disputes, collect fees, and troubleshoot problems',
              'Prevent, detect, and investigate potentially prohibited or illegal activities',
              'Customize, measure and improve our Service and content',
              'Tell you about our Service, service updates, and promotional offers based on your communication preferences',
            ]} />

            <H3>To communicate with you</H3>
            <P>If you request information from us (such as signing up for our newsletter), register on the Sites, or participate in our contests or promotions, we may send you SellBop-related marketing communications as permitted by law. You will have the ability to opt out of such communications.</P>

            <H3>Use of Personal Data About Buyers on Behalf of Our Sellers</H3>
            <P>We use personal information we collect about buyers from or on behalf of our sellers to provide services only as directed or authorized by the seller. We do not use this information for our own purposes.</P>

            <H3>To comply with law</H3>
            <P>We use your personal information as we believe necessary or appropriate to comply with applicable laws, lawful requests and legal process, such as to respond to subpoenas or requests from government authorities, and to protect our rights, privacy, safety or property.</P>

            <H2 id="disclosure">5. Our Disclosure of Your Personal Data</H2>
            <P>We may disclose Personal Data to respond to legal requirements, enforce our policies, respond to claims that a listing or other content violates the rights of others, or protect anyone's rights, property, or safety. We may also share your Personal Data with:</P>
            <UL items={[
              'Service providers under contract who help with our business operations (such as fraud investigations, bill collection, and rewards programs)',
              'Our subsidiaries and corporate affiliates for purposes consistent with this Privacy Policy',
              'Our sellers, when you make a purchase with them using our Services',
              'Other third parties to whom you explicitly ask us to send your information',
              'Stripe, our third-party payments processor — information processed by Stripe is subject to Stripe\'s Privacy Policy',
              'Professional advisors such as lawyers, bankers, auditors and insurers where necessary',
              'Law enforcement or governmental agencies in response to a verified request relating to a criminal investigation or alleged illegal activity',
              'Other business entities in connection with a merger, consolidation, or acquisition of SellBop',
            ]} />

            <H2 id="protection">6. Account Protection</H2>
            <P>Your password is the key to your account. Use unique numbers, letters and special characters, and do not disclose your SellBop password to anyone. If you do share your password or your Personal Data with others, remember that you are responsible for all actions taken in the name of your account. If your password has been compromised for any reason, you should immediately notify SellBop and change your password.</P>

            <H2 id="choices">7. Your Choices</H2>
            <H3>Accessing, Reviewing and Changing Your Personal Data</H3>
            <P>You may change any of your Personal Data in your account by editing your profile within your account or by sending an e-mail to us at the e-mail address set forth below. You may request deletion of your Personal Data, but please note that we may be required to keep this information for a certain time to comply with legal obligations, prevent fraud, collect fees owed, or resolve disputes.</P>

            <H3>Marketing communications</H3>
            <P>You may opt out of marketing-related emails by clicking on a link at the bottom of our marketing emails, or by contacting us at <a href="mailto:support@sellbop.com" className="underline underline-offset-2 hover:text-black">support@sellbop.com</a>. You may continue to receive service-related and other non-marketing emails.</P>

            <H3>Targeted online advertising</H3>
            <P>Some of the business partners that collect information about users' activities on our Sites may be members of organizations that provide choices to individuals regarding the use of their browsing behavior for purposes of targeted advertising. Users may opt out of receiving targeted advertising on websites through members of the Network Advertising Initiative or the Digital Advertising Alliance.</P>

            <H3>Do Not Track Signals</H3>
            <P>Some Internet browsers may be configured to send "Do Not Track" signals to the online services that you visit. We currently do not respond to Do Not Track signals.</P>

            <H2 id="security">8. Security</H2>
            <P>Your information is stored on our servers located in the United States. We use a variety of security technologies and procedures to help protect your Personal Data from unauthorized access, use or disclosure. However, no internet transmission or electronic storage method is 100% secure. Therefore, we do not promise, and you should not expect, that your Personal Data or private communications will always remain private.</P>

            <H2 id="transfers">9. International Transfers</H2>
            <P>SellBop is headquartered in the United States and has service providers in other countries, and your personal information may be transferred to the United States or other locations outside of your state, province, country or other governmental jurisdiction where privacy laws may not be as protective as those in your jurisdiction.</P>
            <P>European Union users should be aware that data may be transferred outside of the European Economic Area. When required, such transfers will be based on appropriate safeguards such as standard contractual clauses or your consent.</P>

            <H2 id="third-party">10. Third Parties</H2>
            <P>This Privacy Policy addresses only the use and disclosure of information we collect from you. If you disclose your information to others on or off our Site, different rules may apply to their use or disclosure of the information you disclose to them. SellBop does not control the privacy policies of third parties, and you are subject to the privacy policies of those third parties where applicable.</P>

            <H2 id="changes">11. Changes to this Privacy Policy</H2>
            <P>We reserve the right to modify this Privacy Policy at any time. We encourage you to periodically review this page for the latest information on our privacy practices. If we make material changes, we will notify you by updating the date of this Privacy Policy and posting it on the Sites. Your continued use of the Sites after the posting of any modified Privacy Policy indicates your acceptance of the terms of the modified Privacy Policy.</P>

            <H2 id="google">12. Google User Data</H2>
            <P>We take the privacy and security of Google user data seriously and adhere to Google's API Services User Data Policy. We do not transfer or sell Google user data to third parties, including advertising platforms, data brokers, or information resellers. The only exceptions are when necessary to provide or improve our app's core features with explicit user consent, for security purposes, to comply with applicable laws, or in the event of a merger or acquisition with prior user consent.</P>
            <P>Our employees, agents and contractors are prohibited from reading Google user data except when the user has given affirmative agreement to view specific data, when necessary for security purposes, or when required to comply with applicable laws. We do not use Google user data for serving advertisements, determining creditworthiness, or any purposes not explicitly disclosed in this privacy policy.</P>

            <H2 id="contact">13. Contact Us</H2>
            <P>If you have any questions or concerns about our Privacy Policy, please feel free to email us at <a href="mailto:support@sellbop.com" className="underline underline-offset-2 hover:text-black">support@sellbop.com</a>.</P>

            <H2 id="eu">14. Additional Information for European Union Users</H2>
            <H3>Personal information</H3>
            <P>References to "personal information" in this Privacy Policy are equivalent to "personal data" governed by European data protection legislation.</P>

            <H3>Controller</H3>
            <P>For purposes of European data protection legislation, SellBop, Inc. is the controller of personal information that we collect for our own business purposes. SellBop acts as a processor to sellers through the Services. When we act as a processor to a seller, the relevant seller is the data controller of your personal information processed in connection with the sale or delivery of goods to you.</P>

            <H3>Your rights</H3>
            <P>European data protection laws give EU users certain rights regarding their personal information. If you are located within the European Union, you may ask us to take the following actions in relation to your personal information:</P>
            <UL items={[
              'Opt-out — Stop sending you direct marketing communications',
              'Access — Provide you with information about our processing of your personal information',
              'Correct — Update or correct inaccuracies in your personal information',
              'Delete — Delete your personal information',
              'Transfer — Transfer a machine-readable copy of your personal information to you or a third party',
              'Restrict — Restrict the processing of your personal information',
              'Object — Object to our reliance on our legitimate interests as the basis of our processing',
            ]} />
            <P>You can submit these requests by email to <a href="mailto:support@sellbop.com" className="underline underline-offset-2 hover:text-black">support@sellbop.com</a>. We may request specific information from you to help us confirm your identity and process your request.</P>

            <H3>Retention</H3>
            <P>We will only retain your personal information for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements.</P>

            <div className="mt-12 pt-6 border-t border-neutral-100">
              <p className="text-xs text-neutral-400">Questions about our privacy practices? Email us at <a href="mailto:support@sellbop.com" className="underline underline-offset-2 hover:text-black">support@sellbop.com</a></p>
            </div>

          </article>
        </div>
      </div>
    </div>
  )
}
