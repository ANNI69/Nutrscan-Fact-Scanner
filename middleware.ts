import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // No server-side redirects; client-side AuthGate handles routing.
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
