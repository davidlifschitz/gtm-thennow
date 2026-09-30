import { it, expect } from "vitest";
import { loadPage, tick } from "./page.js";
it("draws each image cover-fit instead of stretched", async () => {
  const p = loadPage({ sizes: { "old.png": [800, 600], "new.png": [1600, 900] } });
  const calls = [];
  p.window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
    get: (_, k) => k === "drawImage" ? (...a) => calls.push(a.slice(1)) : () => {},
    set: () => true,
  });
  p.window.HTMLCanvasElement.prototype.toBlob = () => {};
  await p.pick("before", p.file("old.png"));
  await p.pick("after", p.file("new.png"));
  p.$("png").click();
  expect(calls.length).toBe(2);
  for (const [sx, sy, sw, sh, dx, dy, dw, dh] of calls) {
    // source crop keeps the canvas aspect ratio, so nothing is stretched
    expect(Math.abs(sw / sh - dw / dh)).toBeLessThan(0.01);
  }
});
