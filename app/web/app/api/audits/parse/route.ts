export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Missing file field 'file'." }, { status: 400 });
    }

    const fd = new FormData();
    fd.append("file", file, file.name);

    const backendURL = process.env.BACKEND_URL || "http://localhost:4000";
    const r = await fetch(`${backendURL}/api/audits/parse`, { method: "POST", body: fd });
    const text = await r.text(); 
    return new Response(text, { status: r.status, headers: { "content-type": "application/json" } });
  } catch (err: any) {
    return Response.json({ error: err?.message || "Proxy error" }, { status: 500 });
  }
}
