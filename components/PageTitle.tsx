export default function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
      {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}
