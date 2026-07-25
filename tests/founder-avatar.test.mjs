import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("founder avatar keeps a readable portrait against the scrolling light veil", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.v13-founder-avatar img\{\s*filter:\s*brightness\(1\.4[0-9]\) contrast\(\.9[0-9]\) saturate\(1\.0[0-9]\)/,
    "portrait should receive a local brightness lift instead of relying on page lighting",
  );
});
