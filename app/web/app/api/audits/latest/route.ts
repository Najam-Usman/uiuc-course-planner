export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backendURL = process.env.BACKEND_URL || "http://localhost:4000";
    const r = await fetch(`${backendURL}/api/audits/latest`, { cache: "no-store" });
    const text = await r.text();
    return new Response(text, { status: r.status, headers: { "content-type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Proxy error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
