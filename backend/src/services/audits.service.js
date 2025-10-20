import { spawn } from "child_process";

function spawnPromise(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore","pipe","pipe"], shell: false, ...options });
    let stdout = "", stderr = "";
    child.stdout.on("data", d => (stdout += d.toString()));
    child.stderr.on("data", d => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", code => (code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr || `Exit ${code}`))));
  });
}

async function resolvePython() {
  const candidates = [process.env.PYTHON, "/opt/venv/bin/python", "/usr/bin/python3", "/usr/local/bin/python3", "python3", "python"].filter(Boolean);
  for (const py of candidates) { try { await spawnPromise(py, ["-V"]); return py; } catch {} }
  throw new Error("No working Python interpreter found.");
}

export async function parseAuditPdf(pdfAbsPath) {
  const python = await resolvePython();

  const pyCode = `
from audit_parser.parser import parse
from dataclasses import asdict
import json, sys
pdf = sys.argv[1]
pa = parse(pdf)
print(json.dumps(asdict(pa), ensure_ascii=False))
`;

  const env = { ...process.env, PYTHONPATH: "/app/audit-parser" };

  const { stdout } = await spawnPromise(python, ["-c", pyCode, pdfAbsPath], {
    cwd: "/app/audit-parser",
    env,
  });

  return JSON.parse(stdout);
}
