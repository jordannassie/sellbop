// ============================================================
// FUTURE: STRIPE ADAPTER PLACEHOLDER
// Implement IPaymentsProvider and ISubscriptionProvider here.
// See NEXT_BACKEND_INTEGRATION_STEPS.md for exact steps.
// ============================================================

// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// export interface IPaymentsProvider {
//   createCheckoutSession(params: CheckoutParams): Promise<{ url: string }>
//   createSubscriptionCheckout(params: SubscriptionParams): Promise<{ url: string }>
//   createBillingPortalSession(customerId: string): Promise<{ url: string }>
//   handleWebhook(body: string, signature: string): Promise<StripeWebhookEvent>
// }

// export class StripePaymentsAdapter implements IPaymentsProvider {
//   async createCheckoutSession(params) {
//     const session = await stripe.checkout.sessions.create({ ... })
//     return { url: session.url! }
//   }
// }

// For Stripe Connect (payouts):
// export class StripeConnectAdapter {
//   async createConnectedAccount(email: string): Promise<string>
//   async createAccountLink(accountId: string): Promise<string>
//   async createTransfer(amount: number, destination: string): Promise<void>
// }

export {}
