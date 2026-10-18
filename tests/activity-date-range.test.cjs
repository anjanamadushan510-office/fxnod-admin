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

test("an end date alone filters that full calendar day", () => {
  const from = moduleExports.activityDateRange("2026-10-15", "");
  const to = moduleExports.activityDateRange("", "2026-10-15");
  assert.deepEqual({ ...from }, { ...to });
});

test("invalid calendar dates and reversed ranges cannot silently broaden the filter", () => {
  for (const [from, to] of [
    ["2026-02-30", ""], ["2026-13-01", ""], ["2026-00-12", ""],
    ["2026-10-18", "2026-10-15"], ["2026-10-15", "not-a-date"],
  ]) {
    assert.ok(moduleExports.activityDateRangeError(from, to));
    assert.throws(() => moduleExports.activityDateRange(from, to));
  }
});

test("month and leap-day boundaries include the full selected date", () => {
  const range = moduleExports.activityDateRange("2028-02-29", "2028-02-29");
  assert.equal(range.active_since, new Date(2028, 1, 29).toISOString());
  assert.equal(range.active_until, new Date(2028, 2, 1).toISOString());
});

test("calendar boundaries respect Sri Lankan offsets and daylight-saving days", () => {
  const originalTimezone = process.env.TZ;
  try {
    process.env.TZ = "Asia/Colombo";
    const colombo = moduleExports.activityDateRange("2026-10-15", "");
    assert.equal(colombo.active_since, "2026-10-14T18:30:00.000Z");
    assert.equal(colombo.active_until, "2026-10-15T18:30:00.000Z");
    process.env.TZ = "America/New_York";
    for (const [day, hours] of [["2026-03-08", 23], ["2026-11-01", 25]]) {
      const range = moduleExports.activityDateRange(day, "");
      assert.equal(new Date(range.active_until) - new Date(range.active_since), hours * 60 * 60 * 1000);
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
