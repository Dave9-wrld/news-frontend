import { GET as mainGet } from "../route";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  url.searchParams.set("type", "headlines");
  const modifiedReq = new Request(url.toString(), request);
  return mainGet(modifiedReq);
}
