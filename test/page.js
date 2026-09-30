import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8").replace('<script src="app.js"></script>', "");
const app = readFileSync(new URL("app.js", root), "utf8");

export function loadPage({ sizes = {} } = {}) {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(w) {
      w.URL.createObjectURL = (b) => "blob:" + (b.name || "x");
      w.URL.revokeObjectURL = () => {};
      // images "load" instantly with a size picked by filename
      class Img extends w.EventTarget {
        set src(v) { this._src = v; const s = sizes[v.slice(5)] || [800, 600]; this.naturalWidth = s[0]; this.naturalHeight = s[1]; setTimeout(() => this.onload && this.onload()); }
        get src() { return this._src; }
      }
      w.Image = Img;
      const downloads = (w.__downloads = []);
      w.HTMLAnchorElement.prototype.click = function () { downloads.push({ name: this.download, href: this.href }); };
    },
  });
  const w = dom.window;
  w.eval(app);
  const $ = (id) => w.document.getElementById(id);
  const file = (name, type = "image/png", size = 10) => new w.File(["x".repeat(size)], name, { type });
  const pick = async (slot, f) => {
    const input = $(slot === "before" ? "fileBefore" : "fileAfter");
    Object.defineProperty(input, "files", { value: [f], configurable: true });
    input.dispatchEvent(new w.Event("change"));
    await new Promise((r) => setTimeout(r, 5));
  };
  const blobs = [];
  const OrigBlob = w.Blob;
  w.Blob = class extends OrigBlob { constructor(parts, o) { super(parts, o); this._text = parts.join(""); blobs.push(this); } };
  return { dom, window: w, $, file, pick, blobs };
}
export const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));
