/**
 * Placeholder for the platform admin area: a read-only table of every subscription with
 * filters, search and cursor pagination. The module is loaded lazily by the router and is
 * never imported by the rest of the app.
 */
export function AdminSubscriptionsPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-semibold">Subscriptions</h1>
      <p className="text-sm text-content-muted">
        Every organisation, its plan, status and seat usage. Changes to money
        stay in Stripe; this view is read-only.
      </p>
    </div>
  );
}
