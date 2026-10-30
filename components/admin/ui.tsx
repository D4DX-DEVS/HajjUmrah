// Small shared pieces for the admin screens: class names, a labelled field, a card and a few icons.
export const input =
  "w-full rounded-sm border border-hairline bg-white px-3 py-2 text-[15px] text-ink shadow-sm placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btnBase} bg-ink text-gold-light shadow-sm hover:bg-ink-soft`;
export const btnSecondary = `${btnBase} border border-hairline bg-white text-ink hover:border-gold hover:bg-white`;
export const btnDanger = `${btnBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`;
export const btnLink = "text-sm font-semibold text-madinah hover:underline focus-visible:outline-2 focus-visible:outline-gold-deep";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-hairline bg-white p-4 shadow-sm">
      {title && <h3 className="mb-3 font-display text-base font-extrabold text-ink">{title}</h3>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Notice({ kind, children }: { kind: "ok" | "error"; children: React.ReactNode }) {
  const tone = kind === "ok" ? "border-gold/40 bg-madinah-wash text-madinah-deep" : "border-red-200 bg-red-50 text-red-800";
  return (
    <div role={kind === "ok" ? "status" : "alert"} className={`rounded-sm border px-3 py-2 text-sm ${tone}`}>
      {children}
    </div>
  );
}

const icon = "h-4 w-4 shrink-0";
type P = { className?: string };
export const IconSearch = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const IconPlus = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
);
export const IconBack = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
);
export const IconChevron = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 18 6-6-6-6" /></svg>
);
export const IconX = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconUpload = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
);
export const IconEye = ({ className = icon, off }: P & { off?: boolean }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{off && <path d="m3 3 18 18" />}
  </svg>
);
export const IconExternal = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
);
export const IconList = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>
);
export const IconPlay = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="M7 5v14l12-7z" /></svg>
);
export const IconLogout = ({ className = icon }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9" /></svg>
);
