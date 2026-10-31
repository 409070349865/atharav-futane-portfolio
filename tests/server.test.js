import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";
import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import { getAssistantProviderFailure } from "../server/assistant-errors.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
let serverProcess;
let origin;
let databaseDirectory;
let providerServer;
let providerOrigin;
let providerRequestCount = 0;
let startupError = "";
let adminCookie = "";
const invalidTestKey = "sk-test-secret-that-must-not-leak";

async function unusedPort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
  return port;
}

async function request(path, options = {}) {
  return fetch(`${origin}${path}`, {
    ...options,
    headers: {
      ...(options.method && options.method !== "GET" ? { Origin: origin } : {}),
      ...options.headers
    }
  });
}

before(async () => {
  const port = await unusedPort();
  origin = `http://127.0.0.1:${port}`;
  databaseDirectory = await mkdtemp(join(tmpdir(), "portfolio-api-test-"));
  providerServer = createHttpServer((_req, res) => {
    providerRequestCount += 1;
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: {
        message: `Incorrect API key provided: ${invalidTestKey}`,
        type: "invalid_request_error",
        code: "invalid_api_key"
      }
    }));
  });
  providerServer.listen(0, "127.0.0.1");
  await once(providerServer, "listening");
  providerOrigin = `http://127.0.0.1:${providerServer.address().port}/v1`;
  serverProcess = spawn(process.execPath, ["server/index.js"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      PUBLIC_ORIGIN: origin,
      DATABASE_PATH: join(databaseDirectory, "test.sqlite"),
      ADMIN_PASSWORD: "test-password-for-admin",
      ADMIN_SESSION_SECRET: "test-session-secret-with-more-than-thirty-two-characters",
      OPENAI_API_KEY: invalidTestKey,
      OPENAI_BASE_URL: providerOrigin
    },
    stdio: ["ignore", "ignore", "pipe"]
  });
  serverProcess.stderr.on("data", chunk => { startupError += chunk.toString(); });

  let ready = false;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (serverProcess.exitCode !== null) break;
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for the local test server to start. */ }
    await delay(100);
  }
  assert.equal(ready, true, `The API did not start. ${startupError}`);
});

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill();
    await Promise.race([once(serverProcess, "exit"), delay(5000)]);
  }
  if (providerServer) {
    providerServer.closeAllConnections();
    await new Promise(resolveClose => providerServer.close(resolveClose));
  }
  if (databaseDirectory) await rm(databaseDirectory, { recursive: true, force: true });
});

test("health and assistant configuration", async () => {
  const health = await request("/api/health");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  assert.match(health.headers.get("content-security-policy"), /img-src[^;]*blob:/);
  assert.match(health.headers.get("content-security-policy"), /frame-ancestors 'self'/);

});

test("assistant rejects an invalid provider key without exposing it", async () => {
  const assistant = await request("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "What projects are listed?" })
  });
  const body = await assistant.json();
  await delay(50);

  assert.equal(assistant.status, 503);
  assert.match(body.error, /key was rejected/);
  assert.equal(JSON.stringify(body).includes(invalidTestKey), false);
  assert.equal(providerRequestCount, 1);
  assert.equal(startupError.includes(invalidTestKey), false);
});

test("assistant provider failures never expose API keys", () => {
  const failure = getAssistantProviderFailure({
    status: 401,
    message: `Incorrect API key provided: ${invalidTestKey}`
  });
  assert.equal(failure.status, 503);
  assert.match(failure.message, /valid secret API key/);
  assert.equal(failure.message.includes(invalidTestKey), false);
  assert.equal(getAssistantProviderFailure({ status: 429 }).status, 503);
  assert.equal(getAssistantProviderFailure(new Error("network failure")).status, 503);
});

test("same-origin enforcement, event validation, and contact submission", async () => {
  const denied = await fetch(`${origin}/api/analytics`, {
    method: "POST",
    headers: { Origin: "https://untrusted.example", "Content-Type": "application/json" },
    body: JSON.stringify({ type: "page_view" })
  });
  assert.equal(denied.status, 403);

  const invalidEvent = await request("/api/analytics", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "admin_login" })
  });
  assert.equal(invalidEvent.status, 400);

  const projectEvent = await request("/api/analytics", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "project_view", projectId: "signalsync" })
  });
  assert.equal(projectEvent.status, 204);

  const contact = await request("/api/contact", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Visitor", email: "visitor@example.com", subject: "Internship opportunity",
      message: "I would like to discuss an opportunity.", website: ""
    })
  });
  assert.equal(contact.status, 201);
  assert.match((await contact.json()).message, /saved privately/);
});

test("admin login protects analytics and contact submissions", async () => {
  const unauthenticated = await request("/api/admin/analytics");
  assert.equal(unauthenticated.status, 401);

  const badLogin = await request("/api/admin/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "wrong-password" })
  });
  assert.equal(badLogin.status, 401);

  const login = await request("/api/admin/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "test-password-for-admin" })
  });
  assert.equal(login.status, 200);
  adminCookie = login.headers.get("set-cookie").split(";")[0];
  assert.match(login.headers.get("set-cookie"), /HttpOnly/);

  const dashboard = await request("/api/admin/analytics", { headers: { Cookie: adminCookie } });
  assert.equal(dashboard.status, 200);
  const data = await dashboard.json();
  assert.equal(data.projectEngagement[0].projectId, "signalsync");
  assert.equal(data.submissions[0].email, "visitor@example.com");
  assert.equal(data.eventCounts.find(item => item.type === "project_view").count, 1);
});

test("resume route returns the PDF and records a download", async () => {
  const response = await request("/api/resume");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/pdf/);
  assert.match(response.headers.get("content-disposition"), /attachment/);
  assert.ok((await response.arrayBuffer()).byteLength > 1000);
});

test("admin can permanently delete a contact submission", async () => {
  const deleted = await request("/api/admin/submissions/1", {
    method: "DELETE", headers: { Cookie: adminCookie }
  });
  assert.equal(deleted.status, 204);
  const dashboard = await request("/api/admin/analytics", { headers: { Cookie: adminCookie } });
  assert.equal((await dashboard.json()).submissions.length, 0);
});

test("admin logout expires the session cookie", async () => {
  const logout = await request("/api/admin/logout", {
    method: "POST", headers: { Cookie: adminCookie }
  });
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  const dashboard = await request("/api/admin/analytics");
  assert.equal(dashboard.status, 401);
});
