export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const backendURL = process.env.BACKEND_URL || "http://localhost:4000";
    const body = await req.text(); 
    const r = await fetch(`${backendURL}/api/audits`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const text = await r.text();
    return new Response(text, { status: r.status, headers: { "content-type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Proxy error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
