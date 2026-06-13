import { NextRequest } from "next/server";

export function validateCsrfToken(request: NextRequest): boolean {
  const csrfCookie = request.cookies.get("csrf-token")?.value;
  const csrfHeader = request.headers.get("x-csrf-token");
  return !!csrfCookie && csrfCookie === csrfHeader;
}

export function isValidGetRequest(request: NextRequest): boolean {
  return request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS";
}
