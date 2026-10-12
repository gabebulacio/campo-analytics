import { NextResponse, type NextRequest } from "next/server";

// One Vercel project serves two sites:
//   gabrielbulacio.com, www.  -> personal page (app/site)
//   demo.gabrielbulacio.com   -> the Campo Analytics demo
const PERSONAL = new Set(["gabrielbulacio.com", "www.gabrielbulacio.com"]);

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0];
  if (!PERSONAL.has(host)) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (pathname === "/" && !search) return NextResponse.rewrite(new URL("/site", req.url));
  if (pathname === "/site") return NextResponse.next();
  // Old demo links on the apex keep working.
  return NextResponse.redirect(`https://demo.gabrielbulacio.com${pathname}${search}`, 308);
}

export const config = { matcher: ["/((?!_next/|api/|favicon.ico).*)"] };
