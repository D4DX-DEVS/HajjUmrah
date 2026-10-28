// Cloudflare D1 over its REST API (Vercel has no Cloudflare bindings).
// Needs CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID and CLOUDFLARE_API_TOKEN (permission: D1 Edit).
export const d1Configured = () => !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.D1_DATABASE_ID && process.env.CLOUDFLARE_API_TOKEN);

async function query(sql: string, params: unknown[]) {
  const { CLOUDFLARE_ACCOUNT_ID: acct, D1_DATABASE_ID: db, CLOUDFLARE_API_TOKEN: token } = process.env;
  if (!acct || !db || !token) throw new Error("D1 is not configured");
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/d1/database/${db}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  const j = (await res.json().catch(() => null)) as { success?: boolean; errors?: { message: string }[]; result?: { results?: Record<string, unknown>[] }[] } | null;
  if (!res.ok || !j?.success) throw new Error(`D1 query failed (${res.status}): ${j?.errors?.map((e) => e.message).join("; ") ?? "no response"}`);
  return j.result?.[0]?.results ?? [];
}

export const db = {
  prepare: (sql: string) => ({
    bind: (...params: unknown[]) => ({
      run: () => query(sql, params),
      first: async <T>() => ((await query(sql, params))[0] as T | undefined) ?? null,
    }),
  }),
};
