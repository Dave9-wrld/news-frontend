import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const AUTH_COOKIE = "chronicle_session";

async function proxy(request, context) {
  const { path } = await context.params;
  const backend = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";
  const source = new URL(request.url);
  const target = new URL(`${backend}/${path.join("/")}/`);
  target.search = source.search;
  const headers = {};
  for (const name of ["content-type"]) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  const sessionToken = request.cookies.get(AUTH_COOKIE)?.value;
  if (sessionToken) headers.authorization = `Token ${sessionToken}`;
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseText = response.status === 204 ? null : await response.text();
    const route = path.join("/");
    let body = responseText;
    let token = null;
    if (route === "auth/login" && response.ok) {
      const payload = JSON.parse(responseText);
      token = payload.token;
      delete payload.token;
      body = JSON.stringify(payload);
    }
    const nextResponse = new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") || "application/json" },
    });
    if (token) {
      nextResponse.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    if (route === "auth/logout") nextResponse.cookies.delete(AUTH_COOKIE);
    return nextResponse;
  } catch {
    return NextResponse.json({ detail: "The Chronicle backend is unavailable." }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
