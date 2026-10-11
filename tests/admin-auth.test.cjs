const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Execute the real store with isolated API/token adapters; no live credentials.
function fixture(adminApi) {
  let token = null;
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(join(__dirname, "../src/stores/authStore.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    console,
    require(name) {
      if (name === "zustand") return require("zustand");
      if (name === "@/services/adminApi") return { adminApi };
      if (name === "@/services/authToken") return {
        registerAuthExpiredHandler() {},
        setAdminAccessToken(value) { token = value; },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return { store: exports.useAuthStore, token: () => token };
}

test("failed credentials leave login available and allow a successful retry", async () => {
  const failure = new Error("Invalid credentials");
  let attempt = 0;
  const user = { id: "admin", role: "admin" };
  const f = fixture({
    async login() {
      if (++attempt === 1) throw failure;
      return { access_token: "admin-token" };
    },
    async me() { return user; },
  });
  f.store.setState({ status: "anonymous" });
  await assert.rejects(f.store.getState().login("admin@example.com", "password", "123456"), failure);
  assert.equal(f.store.getState().status, "anonymous");
  assert.equal(f.token(), null);
  await f.store.getState().login("admin@example.com", "password", "123456");
  assert.equal(f.store.getState().status, "authenticated");
  assert.equal(f.store.getState().user, user);
});

test("pending login does not unmount the form via session loading state", async () => {
  let resolve;
  const f = fixture({
    login: () => new Promise((done) => { resolve = done; }),
    async me() { return { role: "admin" }; },
  });
  f.store.setState({ status: "anonymous" });
  const pending = f.store.getState().login("admin@example.com", "password", "123456");
  assert.equal(f.store.getState().status, "anonymous");
  resolve({ access_token: "admin-token" });
  await pending;
  assert.equal(f.store.getState().status, "authenticated");
});

test("profile lookup failure discards the partial session", async () => {
  const failure = new Error("Profile unavailable");
  const f = fixture({
    async login() { return { access_token: "partial-token" }; },
    async me() { throw failure; },
  });
  await assert.rejects(f.store.getState().login("admin@example.com", "password", "123456"), failure);
  assert.equal(f.token(), null);
  assert.equal(f.store.getState().user, null);
  assert.equal(f.store.getState().status, "anonymous");
});

test("email whitespace and authenticator grouping are normalized", async () => {
  let sent;
  const f = fixture({
    async login(credentials) { sent = credentials; return { access_token: "token" }; },
    async me() { return { role: "admin" }; },
  });
  await f.store.getState().login(" admin@example.com ", " password ", "123 456");
  assert.equal(sent.email, "admin@example.com");
  assert.equal(sent.password, " password ");
  assert.equal(sent.totp_code, "123456");
});

test("failed session restoration exits verification and clears stale token", async () => {
  const adapter = {
    async login() { return { access_token: "stale-token" }; },
    async me() { return { role: "admin" }; },
  };
  const f = fixture(adapter);
  await f.store.getState().login("admin@example.com", "password", "123456");
  adapter.me = async () => { throw new Error("Session expired"); };
  await f.store.getState().bootstrap();
  assert.equal(f.store.getState().status, "anonymous");
  assert.equal(f.token(), null);
});
