import { it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { loadPage, tick } from "./page.js";

async function exported() {
  const p = loadPage();
  await p.pick("before", p.file("old.png"));
  await p.pick("after", p.file("new.png"));
  p.$("html").click();
  await tick(20);
  const dom = new JSDOM(p.blobs.at(-1)._text, { runScripts: "dangerously", pretendToBeVisual: true });
  return dom.window;
}
it("exported page moves the split with arrow keys", async () => {
  const w = await exported();
  w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  expect(w.document.getElementById("n").style.clipPath).toBe("inset(0 0 0 45%)");
});
it("exported page supports touch dragging", async () => {
  const w = await exported();
  expect(w.document.getElementById("s").outerHTML + w.document.head.innerHTML).toMatch(/touch-action:\s*none/);
});
