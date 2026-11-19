import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const AUTH_COOKIE = "chronicle_session";

// The browser talks to this same-origin route; Django owns provider credentials.
export async function GET(request) {
  const incoming = new URL(request.url);
  const backend = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";
  const isSources = incoming.searchParams.get("type") === "sources";
  const target = new URL(`${backend}/${isSources ? "sources" : "feed"}/`);
  for (const [key, value] of incoming.searchParams) {
    if (key !== "type" && key !== "sortBy") target.searchParams.append(key, value);
  }
  if (incoming.searchParams.get("type") === "search") {
    target.searchParams.set("q", incoming.searchParams.get("q") || "");
  }
  try {
    const response = await fetch(target, {
      headers: request.cookies.get(AUTH_COOKIE)?.value
        ? { authorization: `Token ${request.cookies.get(AUTH_COOKIE).value}` }
        : {},
      cache: "no-store",
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return NextResponse.json({ status: "error", detail: "The Chronicle backend is unavailable." }, { status: 503 });
  }
}
