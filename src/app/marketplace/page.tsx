import MaterialIcon from "@/components/shell/MaterialIcon";

export default function MarketplacePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6">
          <h1 className="page-title">Marketplace</h1>
          <p className="page-subtitle">Admitted applications, alumni, and specialist connections.</p>
        </div>

        <section className="panel flex min-h-[20rem] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high text-text-muted">
            <MaterialIcon name="storefront" className="!text-3xl" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-text-primary">Coming soon</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
            We&apos;re building a marketplace for admitted student applications and expert connections. Check back
            soon.
          </p>
        </section>
      </div>
    </div>
  );
}
