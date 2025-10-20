const { spawn } = require("child_process");


function spawnPromise(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) return resolve({ code, stdout, stderr });
      const msg = `Command failed (${code}): ${cmd} ${args.join(" ")}\n${stderr || stdout}`;
      reject(new Error(msg));
    });
  });
}

module.exports = { spawnPromise };
