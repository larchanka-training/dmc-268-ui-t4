/**
 * Placeholder for the public pricing page. Plans come from GET /api/plans and checkout
 * is a redirect to Stripe; both land in the billing PR.
 */
export function PricingPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 py-24 text-center">
      <h1 className="text-xl font-semibold">Pricing</h1>
      <p className="text-sm text-content-muted">
        Per-seat plans, billed monthly. This page is next in line: it will list
        the plans served by the API and send buyers to Stripe Checkout.
      </p>
    </div>
  );
}
