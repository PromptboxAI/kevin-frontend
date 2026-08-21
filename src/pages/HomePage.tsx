export default function HomePage() {
  return (
    <main className="k-portal">
      <div className="k-portal-card">
        <p className="k-portal-brand">
          Kevin<span>.</span>
        </p>
        <h1>Application scaffold</h1>
        <p>
          The production app is being built here. The client portal route at <code>/p/:token</code>{' '}
          is live.
        </p>
      </div>
    </main>
  )
}
