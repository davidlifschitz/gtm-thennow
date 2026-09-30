import { it, expect } from "vitest";
import { loadPage, tick } from "./page.js";

async function ready() {
  const p = loadPage();
  await p.pick("before", p.file("old.png"));
  await p.pick("after", p.file("new.png"));
  return p;
}

it("enables compare once both images are in", async () => {
  const p = loadPage();
  expect(p.$("slider").disabled).toBe(true);
  await p.pick("before", p.file("old.png"));
  expect(p.$("slider").disabled).toBe(true);
  await p.pick("after", p.file("new.png"));
  expect(p.$("slider").disabled).toBe(false);
  expect(p.$("stage").querySelectorAll(".layer").length).toBe(2);
});

it("rejects oversized and non-image files", async () => {
  const p = loadPage();
  await p.pick("before", p.file("big.png", "image/png", 9 * 1024 * 1024));
  expect(p.$("warn").textContent).toMatch(/over 8 MB/);
  await p.pick("before", p.file("a.pdf", "application/pdf"));
  expect(p.$("warn").textContent).toMatch(/not a PNG/);
});

it("exported HTML opens at the split you chose", async () => {
  const p = await ready();
  p.$("slider").value = "20";
  p.$("slider").dispatchEvent(new p.window.Event("input"));
  p.$("html").click();
  await tick(20);
  const page = p.blobs.at(-1)._text;
  expect(page).toContain("inset(0 0 0 20%)");
  expect(page).not.toContain("inset(0 0 0 50%)");
});
