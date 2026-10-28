import { handleAdmin } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

// handleAdmin routes by method and path (login, session, post, videos, upload, logout)
export const GET = handleAdmin;
export const POST = handleAdmin;
export const DELETE = handleAdmin;
