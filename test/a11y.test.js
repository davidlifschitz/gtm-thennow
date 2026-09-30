import { it, expect } from "vitest";
import { loadPage } from "./page.js";
it("slider and file inputs have names", () => {
  const { $ } = loadPage();
  expect($("slider").getAttribute("aria-label")).toMatch(/split|compare/i);
  expect($("fileBefore").getAttribute("aria-label")).toMatch(/before/i);
  expect($("fileAfter").getAttribute("aria-label")).toMatch(/after/i);
});
it("warnings are announced", () => {
  expect(loadPage().$("warn").getAttribute("role")).toBe("status");
});
