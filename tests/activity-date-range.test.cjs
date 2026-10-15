const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync("src/lib/activityDateRange.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const moduleExports = {};
vm.runInNewContext(source, { exports: moduleExports, Date, Number });

test("a single selected date covers that complete local calendar day", () => {
  const range = moduleExports.activityDateRange("2026-10-15", "");
  assert.equal(new Date(range.active_since).getDate(), 15);
  assert.equal(new Date(range.active_until).getDate(), 16);
});

test("a selected date range includes the full final day", () => {
  const range = moduleExports.activityDateRange("2026-10-12", "2026-10-15");
  const duration = new Date(range.active_until) - new Date(range.active_since);
  assert.equal(duration, 4 * 24 * 60 * 60 * 1000);
});

test("an empty selection does not send activity filters", () => {
  assert.deepEqual({ ...moduleExports.activityDateRange("", "") }, {});
});
