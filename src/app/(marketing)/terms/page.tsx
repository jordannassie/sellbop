import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — SellBop.com',
  description: 'SellBop Terms of Service — the agreement governing your use of the SellBop platform.',
}

const SECTIONS = [
  { id: 'overview',        label: '1. Overview of Services' },
  { id: 'interactions',    label: '2. Interactions with Other Users' },
  { id: 'use',             label: '3. Use of the Services' },
  { id: 'registration',    label: '4. Registration' },
  { id: 'payments',        label: '5. Third-Party Payments Providers' },
  { id: 'supplier',        label: '6. Supplier-Specific Terms' },
  { id: 'refunds',         label: '7. Refunds, Chargebacks & Disputes' },
  { id: 'purchasing',      label: '8. Purchasing Products' },
  { id: 'currency',        label: '9. Currency Conversion' },
  { id: 'taxes',           label: '10. Taxes' },
  { id: 'supplier-oblig',  label: '11. Additional Supplier Obligations' },
  { id: 'content',         label: '12. Responsibility for Content' },
  { id: 'ownership',       label: '13. Ownership' },
  { id: 'conduct',         label: '14. User Conduct & Restrictions' },
  { id: 'solicitation',    label: '15. No Solicitation' },
  { id: 'monitoring',      label: '16. Investigations & Monitoring' },
  { id: 'release',         label: '18. Release' },
  { id: 'indemnification', label: '19. Indemnification' },
  { id: 'disclaimer',      label: '20. Disclaimer of Warranties' },
  { id: 'termination',     label: '22. Termination' },
  { id: 'governing',       label: '24. Governing Law' },
  { id: 'arbitration',     label: '25. Arbitration Agreement' },
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
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 mb-4">
      <p className="text-xs text-neutral-600 leading-relaxed">{children}</p>
    </div>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-black mb-2">Terms of Service</h1>
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
                <Link href="/privacy" className="text-xs text-neutral-400 hover:text-black transition-colors">Privacy Policy →</Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 min-w-0">

            <Note>
              PLEASE READ THIS TERMS OF SERVICE AGREEMENT CAREFULLY. BY ACCESSING OR USING OUR SERVICES IN ANY WAY YOU REPRESENT THAT YOU HAVE READ, UNDERSTAND, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE, YOU MAY NOT ACCESS OR USE THE SERVICES.
            </Note>

            <Note>
              SECTION 25 (ARBITRATION AGREEMENT) CONTAINS PROVISIONS GOVERNING HOW TO RESOLVE DISPUTES BETWEEN YOU AND SELLBOP, INCLUDING AN AGREEMENT TO ARBITRATE AND A CLASS ACTION WAIVER. PLEASE READ IT CAREFULLY.
            </Note>

            <H2 id="overview">1. Overview of Our Services</H2>
            <H3>1.1 SellBop Merchant of Record Services</H3>
            <P>The Services enable sellers of digital products ("Suppliers") that have a Supplier Account with SellBop to appoint SellBop as such Suppliers' non-exclusive reseller of certain of their digital products that SellBop deems eligible for resale through the Services ("Digital Products" or "Products"). Products offered for resale by SellBop are available to buyers ("Buyers") either on the Website, or on the applicable Supplier's owned or controlled website(s) ("Supplier Property") that leverages the Services.</P>

            <H3>1.2 SellBop Affiliate Program</H3>
            <P>A Supplier may voluntarily participate in the SellBop Affiliate Program, which allows the Supplier to designate one or more eligible users as an affiliate ("Affiliate"). An Affiliate is permitted to promote the applicable Supplier's Digital Product(s) by publishing Links on such Affiliate's website(s) or otherwise sharing the Links with prospective Buyers, and such Affiliate will earn financial compensation from the applicable Supplier upon the completion of a qualifying Affiliate Transaction.</P>

            <H2 id="interactions">2. Interactions with Other Users</H2>
            <P>When interacting with other users you should exercise caution and common sense to protect your personal safety and property. You are solely responsible for your interactions with other users and any other parties with whom you interact. YOU AGREE THAT NEITHER SELLBOP NOR ITS AFFILIATES OR LICENSORS ARE RESPONSIBLE FOR THE CONDUCT OF ANY USER OF THE SERVICES, AND THAT SELLBOP MAKES NO REPRESENTATION WITH RESPECT TO INTERACTIONS BETWEEN USERS.</P>

            <H2 id="use">3. Use of the Services</H2>
            <H3>3.1 Website License</H3>
            <P>Subject to your compliance with this Agreement, SellBop grants you a limited, non-exclusive, non-transferable, revocable license to access and use the features and functionality of the Platform available through the Website for your own personal or lawful business purposes.</P>

            <H3>3.2 Application License</H3>
            <P>Subject to your compliance with this Agreement, SellBop grants you a limited, non-exclusive, non-transferable, revocable license to download, install and use a copy of any Application on a single mobile device or computer that you own or control, solely for your own personal or lawful business purposes.</P>

            <H3>3.3 Updates</H3>
            <P>You understand that the Services are evolving. SellBop may update the Services with or without notifying you. You may need to update third-party software from time to time in order to use the Services.</P>

            <H3>3.4 SellBop Communications</H3>
            <P>By entering into this Agreement or using the Services, you agree to receive communications from us, including via e-mail, text message, calls, and/or push notifications. Communications from us may include operational notices, feature updates, promotions, and news concerning SellBop.</P>

            <H2 id="registration">4. Registration</H2>
            <H3>4.1 Registering Your Account</H3>
            <P>In order to access certain features of the Services you may be required to become a Registered User. In registering an account, you agree to provide true, accurate, current and complete information about yourself. You represent that you are at least thirteen (13) years old and of legal age to form a binding contract. You are responsible for all activities that occur under your Account.</P>

            <H3>4.2 Registration Data</H3>
            <P>You agree to maintain and promptly update your Registration Data to keep it true, accurate, current and complete. You may not share your Account or password with anyone, and you agree to notify SellBop immediately of any unauthorized use of your password or any other breach of security.</P>

            <H2 id="payments">5. Third-Party Payments Providers</H2>
            <P>SellBop uses Stripe, Inc. and its affiliates as third-party service providers for payment processing services. By using the Services, you agree to be bound by Stripe's Privacy Policy and its Stripe Connected Account Agreement. You consent and authorize SellBop and Stripe to share any information and payment instructions you provide to the minimum extent required to complete your transactions.</P>

            <H2 id="supplier">6. Supplier-Specific Terms</H2>
            <H3>6.1 Appointment</H3>
            <P>You hereby appoint SellBop as your non-exclusive reseller of the Digital Products that you expressly agree to be resold by SellBop and that SellBop deems eligible for resale through the Services. SellBop has sole discretion to determine and change from time to time the product categories and products that are eligible for resale. SellBop reserves the right not to sell any products it considers fraudulent or illegal under any applicable law.</P>

            <H3>6.2 Merchant of Record Services</H3>
            <P>In connection with the appointment under Section 6.1, SellBop will use commercially reasonable efforts to: (a) establish a Supplier Account dashboard; (b) act as your non-exclusive reseller across all supported territories; (c) facilitate the delivery of your Products to Buyers; (d) provide Buyers with post-sale support including refunds, chargebacks, and payment reconciliation; and (e) handle relevant Indirect Tax collection, reporting and remittance.</P>

            <H3>6.3 Pricing Determination</H3>
            <P>For each of your Products, you will provide us with your suggested retail price. SellBop, as merchant of record, reserves the right to set the price at which such Product is offered for resale to Buyers through the Services.</P>

            <H3>6.4 SellBop Fee and Supplier Fee</H3>
            <P>In consideration of SellBop's services, you agree to pay SellBop a per-transaction fee (the "SellBop Fee") for each resale made by SellBop through the Services. The SellBop Fee is automatically deducted from the purchase price paid by the Buyer, with the remainder (less any taxes and other charges) owed and paid to you (the "Supplier Fee"). Current fees are available on the <Link href="/pricing" className="underline underline-offset-2 hover:text-black">Pricing page</Link>.</P>

            <H3>6.5–6.9 Additional Supplier Terms</H3>
            <P>Suppliers grant SellBop a worldwide, royalty-free license to promote, market, resell and facilitate access to their Products. Suppliers represent and warrant that they own their Products, that Products comply with all applicable laws, that none of their Products constitute prohibited content, and that resale will not violate rules of card networks or third-party payment providers.</P>

            <H2 id="refunds">7. Refunds, Chargebacks & Disputes</H2>
            <H3>7.1 If you are a Supplier</H3>
            <P>SellBop will handle Buyers' requests for refunds, chargebacks and other disputes in SellBop's sole discretion. The Supplier shall, at SellBop's request, provide all information requested by SellBop to resolve Buyers' requests or disputes. Supplier is responsible for reimbursing SellBop for amounts paid to Buyers in connection with refunds, chargebacks or disputes.</P>

            <H3>7.2 If you are a Buyer</H3>
            <P>If you request a refund and also pursue a dispute resolution process for the same transaction with your payment method provider, we will decline your refund request. You agree not to submit a refund request for any Product if you have already chosen to pursue a dispute resolution process with your payment method provider.</P>

            <H2 id="purchasing">8. Purchasing Products</H2>
            <H3>8.1 Purchasing Process</H3>
            <P>A Buyer may purchase Products through the Services with or without an Account. Having an Account allows a Buyer to access their purchase history and purchased Digital Products through their SellBop Library anytime. All purchases through the Platform are final and Buyer is responsible for all approved charges, except as set forth herein.</P>

            <H3>8.2 Subscriptions</H3>
            <P>The Services may allow Buyers to purchase access to a Digital Product on a subscription basis ("Subscription"). The Subscription will continue and automatically renew at SellBop's then-current price until terminated. By subscribing, the Buyer authorizes SellBop to charge the payment method in the Buyer's Account at the beginning of each Subscription Period. SellBop reserves the right to change prices at any time with commercially reasonable notice.</P>

            <H2 id="currency">9. Currency Conversion</H2>
            <P>If the retail price of a Product is listed in a currency other than United States Dollars (USD), SellBop will calculate a USD price based upon an exchange rate determined by SellBop. SellBop cannot guarantee that exchange rates reflect the most up-to-date rate. Regardless of listed currency, all transactions through the Services will settle in USD.</P>

            <H2 id="taxes">10. Taxes</H2>
            <P>As the merchant of record, SellBop will be treated as the supplier for relevant Indirect Tax (including sales, use, VAT and goods and services tax) purposes in respect of Products resold through the Services. SellBop will be responsible for the administration, collection, reporting and remittance of any relevant Indirect Tax. It is your personal responsibility to disclose your earnings to your relevant tax authority and ensure you are paying the correct amount of tax.</P>

            <H2 id="supplier-oblig">11. Additional Supplier Obligations</H2>
            <P>SellBop does not assess or collect "listing" or "insertion" fees, but will collect the SellBop Fee from buyer proceeds. Suppliers agree that they will not promote, distribute or deliver Products that: (a) violate card network rules or third-party payments provider rules; (b) constitute illegal activity; (c) promote discrimination based on race, sex, religion, nationality, disability, sexual orientation or age; or (d) target children under the age of thirteen (13).</P>
            <P>If a Supplier experiences a refund rate in excess of 15%, SellBop may hold in reserve an amount equal to 25% of Supplier's funds pending settlement for 90 days on a rolling basis. If a Supplier experiences a refund rate in excess of 25%, the Supplier's Account may be suspended, terminated, or subject to additional conditions or fees.</P>

            <H2 id="content">12. Responsibility for Content</H2>
            <P>You, and not SellBop, are entirely responsible for all Content that you upload, post, transmit or otherwise make available through the Services ("Your Content"). SellBop has no obligation to store any of Your Content. SellBop retains the right to create reasonable limits on its use and storage of Content, including limits on file size, storage space, and processing capacity.</P>

            <H2 id="ownership">13. Ownership</H2>
            <P>Except with respect to Your Content, you agree that SellBop and its suppliers own all rights, title and interest in the Services. SellBop does not claim ownership of Your Content. However, when you post or publish Your Content on the Services, you grant SellBop a fully paid, royalty-free, perpetual, irrevocable, worldwide, non-exclusive license to use, distribute, reproduce, modify, adapt, publicly perform and publicly display Your Content for the purposes of operating and providing the Services.</P>

            <H2 id="conduct">14. User Conduct & Restrictions</H2>
            <P>As a condition of use, you agree not to use the Services for any purpose prohibited by this Agreement or by applicable law. You shall not license, sell, rent, lease, transfer, or otherwise commercially exploit the Services; frame or utilize framing techniques to enclose SellBop trademarks or logos; use automated software to scrape or download data from the Services; or remove any copyright notices from the Services.</P>
            <P>You shall not make available any Content on or through the Services that: infringes any patent, trademark, copyright or other right; is unlawful, threatening, abusive, harassing, defamatory, libelous, pornographic, deceptive, fraudulent, invasive of another's privacy, obscene, or discriminatory; constitutes unauthorized advertising or junk e-mail; or impersonates any person or entity.</P>

            <H2 id="solicitation">15. No Solicitation</H2>
            <P>The Platform may not be used to solicit for any other business, website or services. You may not solicit, advertise for, or contact users for employment, contracting, or any other purpose not related to the facilitated Services.</P>

            <H2 id="monitoring">16. Investigations, Monitoring & Content Moderation</H2>
            <P>SellBop may, but is not obligated to, investigate, monitor, pre-screen, remove, refuse, or review the Services and/or Content at any time. SellBop reserves the right to remove or refuse to post any of Your Content for any or no reason in its sole discretion, take any action with respect to Content that violates this Agreement, disclose your identity to any third party who claims material posted by you violates their rights, and terminate or suspend your access to all or part of the Services for any violation of this Agreement.</P>

            <H2 id="release">18. Release</H2>
            <P>In the event that you have a dispute with one or more users, you release SellBop, its parents, subsidiaries, affiliates, officers, employees, agents, partners and licensors from any and all claims, demands, or damages of every kind and nature arising out of or in any way connected with such disputes.</P>

            <H2 id="indemnification">19. Indemnification</H2>
            <P>You agree to indemnify and hold SellBop and its affiliates harmless from any losses, costs, liabilities and expenses (including reasonable attorneys' fees) relating to or arising out of: (a) Your Content; (b) your use or inability to use any Service; (c) your violation of this Agreement; (d) your violation of any rights of another party; (e) disputes with other users of the Services; or (f) your violation of any applicable laws, rules or regulations.</P>

            <H2 id="disclaimer">20. Disclaimer of Warranties</H2>
            <P>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. SELLBOP DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. YOUR USE OF THE SERVICES IS AT YOUR SOLE RISK.</P>

            <H2 id="termination">22. Termination</H2>
            <P>SellBop reserves the right to terminate or suspend your Account and your access to the Services at any time, for any reason, with or without notice. Upon termination, your right to use the Services will immediately cease. Provisions of this Agreement that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</P>

            <H2 id="governing">24. Governing Law</H2>
            <P>This Agreement shall be governed by and construed in accordance with the laws of the State of California, without giving effect to any conflict of law principles. You agree to submit to personal jurisdiction in the state and federal courts located in California for any actions for which SellBop retains the right to seek injunctive or other equitable relief.</P>

            <H2 id="arbitration">25. Arbitration Agreement</H2>
            <P>PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.</P>
            <P>You and SellBop agree that any dispute, claim or controversy arising out of or relating to this Agreement or the breach, termination, enforcement, interpretation or validity thereof, or to the use of the Services, will be settled by binding arbitration, except that each party retains the right to seek injunctive or other equitable relief in a court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation or violation of a party's copyrights, trademarks, trade secrets, patents, or other intellectual property rights.</P>
            <P>YOU ACKNOWLEDGE AND AGREE THAT YOU AND SELLBOP ARE EACH WAIVING THE RIGHT TO A TRIAL BY JURY OR TO PARTICIPATE AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS ACTION OR REPRESENTATIVE PROCEEDING.</P>

            <div className="mt-12 pt-6 border-t border-neutral-100">
              <p className="text-xs text-neutral-400">Questions about these terms? Email us at <a href="mailto:support@sellbop.com" className="underline underline-offset-2 hover:text-black">support@sellbop.com</a></p>
            </div>

          </article>
        </div>
      </div>
    </div>
  )
}
