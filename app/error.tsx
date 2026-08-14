"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-background px-6 py-24 text-foreground">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-signal">The Mukhmall Show</p>
        <h1 className="mt-5 font-display text-5xl font-bold">Something went wrong.</h1>
        <button onClick={() => reset()} className="mt-8 border border-signal px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-signal">Try again</button>
      </div>
    </main>
  );
}
