export default function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{children}</h1>
      <span className="rule mt-3 block h-0.5 w-20 bg-gold" aria-hidden />
      {sub && <p className="mt-3 text-sm text-neutral-600">{sub}</p>}
    </div>
  );
}
