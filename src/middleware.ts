import { NextResponse, type NextRequest } from "next/server";

/**
 * Content-Security-Policy with a per-request nonce.
 *
 * The console holds an administrator's session, which can approve deposits
 * and close accounts, and it renders customer-supplied text (ticket bodies,
 * names) plus a blog editor. If anything untrusted is ever rendered as markup,
 * this is what stops it from running.
 *
 * A nonce rather than `'unsafe-inline'`: Next.js emits inline bootstrap
 * scripts, so a static policy must allow all inline script, and a policy that
 * allows inline script does not stop XSS. 'strict-dynamic' lets the nonced
 * scripts load the app's own chunks. The cost is per-request rendering, which
 * the root layout opts into by reading the nonce.
 *
 * `connect-src` is the API and nothing else: the console has no reason to
 * talk to any other host, so a script that did get in has nowhere to send a
 * token.
 */

function origin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";

  const connect = new Set<string>(["'self'"]);
  const api = origin(process.env.NEXT_PUBLIC_API_URL);
  if (api) connect.add(api);
  // Hot reload talks to the dev server over a websocket.
  if (isDev) connect.add("ws:");

  // Blog covers are served by the API; a preview before upload is a blob.
  const img = ["'self'", "data:", "blob:"];
  if (api) img.push(api);

  const directives = [
    "default-src 'self'",
    // 'unsafe-eval' in development only: React Refresh needs it.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are used throughout; style cannot run code.
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${[...connect].join(" ")}`,
    "media-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  // Next reads the nonce out of the policy on the REQUEST headers and stamps
  // it on its own scripts; x-nonce is for our layout to read.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  // An admin page must never be stored by a shared cache or indexed.
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
