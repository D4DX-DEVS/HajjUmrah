import { bindings } from "./bindings";

// contact_messages and admin_login_attempts (tables created by migrations/)
export const d1Configured = () => !!bindings.DB;

export const db = { prepare: (sql: string) => bindings.DB!.prepare(sql) };
