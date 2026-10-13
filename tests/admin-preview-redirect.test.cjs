const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function middlewareFor(apiUrl) {
  const source = ts.transpileModule(fs.readFileSync("src/middleware.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      assert.equal(name, "next/server");
      return {
        NextResponse: {
          redirect(url, status) { return { redirectUrl: String(url), status }; },
          next() { return { headers: new Headers(), kind: "next" }; },
        },
      };
    },
    process: { env: { NODE_ENV: "production", NEXT_PUBLIC_API_URL: apiUrl } },
    URL,
    Headers,
    crypto: { randomUUID: () => "test-nonce" },
    btoa,
  });
  return exports.middleware;
}

function request(hostname) {
  return { nextUrl: { hostname, pathname: "/admin/login", search: "?next=%2Fadmin%2Fcommerce" }, headers: new Headers() };
}

test("staging preview URLs lead to the approved admin origin with the path intact", () => {
  const middleware = middlewareFor("https://admin-staging.fxnod.com");
  const response = middleware(request("fxnod-admin-8urexsrhx-sribees-digitel.vercel.app"));
  assert.equal(response.status, 307);
  assert.equal(response.redirectUrl, "https://fxnod-admin-git-staging-sribees-digitel.vercel.app/admin/login?next=%2Fadmin%2Fcommerce");
});

test("the branch alias, other projects and non-staging builds are not redirected", () => {
  const staging = middlewareFor("https://admin-staging.fxnod.com");
  assert.equal(staging(request("fxnod-admin-git-staging-sribees-digitel.vercel.app")).kind, "next");
  assert.equal(staging(request("another-app-8urexsrhx-sribees-digitel.vercel.app")).kind, "next");
  const production = middlewareFor("https://admin-api.fxnod.com");
  assert.equal(production(request("fxnod-admin-8urexsrhx-sribees-digitel.vercel.app")).kind, "next");
});
