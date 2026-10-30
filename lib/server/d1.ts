import { bindings } from "./bindings";

// posts, docs, contact_messages, admin_login_attempts (tables created by migrations/)
export const d1Configured = () => !!bindings.DB;

export const db = { prepare: (sql: string) => bindings.DB!.prepare(sql) };
