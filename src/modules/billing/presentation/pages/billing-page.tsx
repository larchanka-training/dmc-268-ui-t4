/**
 * Placeholder for the subscription screen: current plan, seat usage ("12 of 20 seats")
 * and a link into the Stripe customer portal.
 */
export function BillingPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-semibold">Billing</h1>
      <p className="text-sm text-content-muted">
        Plan, seat usage and invoices will appear here once the billing API is
        in place.
      </p>
    </div>
  );
}
