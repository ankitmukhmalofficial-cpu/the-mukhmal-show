export default function NotFound() {
  return (
    <main className="min-h-screen bg-background px-6 py-24 text-foreground">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-signal">The Mukhmall Show</p>
        <h1 className="mt-5 font-display text-6xl font-bold">Page not found.</h1>
        <a href="/" className="mt-8 inline-flex border border-signal px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-signal">Back home</a>
      </div>
    </main>
  );
}
