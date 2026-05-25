export default function OfflinePage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>You’re offline</h1>
      <p style={{ marginTop: 8, maxWidth: 560, lineHeight: 1.5 }}>
        COSMIQ can’t reach the network right now. You can still view previously cached
        pages. Data may be stale.
      </p>
    </main>
  );
}

