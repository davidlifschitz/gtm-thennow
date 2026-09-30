const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const state = {
  before: null,
  after: null,
  cut: 50,
};

const warnEl = document.getElementById("warn");
const stage = document.getElementById("stage");
const slider = document.getElementById("slider");
const swapBtn = document.getElementById("swap");
const pngBtn = document.getElementById("png");
const htmlBtn = document.getElementById("html");

function setWarn(msg) {
  warnEl.textContent = msg || "";
}

function extOk(file) {
  if (ACCEPT.has(file.type)) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_BYTES) {
      reject(new Error(file.name + " is over 8 MB"));
      return;
    }
    if (!extOk(file)) {
      reject(new Error(file.name + " is not a PNG, JPEG, WebP, or GIF"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ file, url, img, name: file.name });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read " + file.name));
    };
    img.src = url;
  });
}

function revoke(slot) {
  if (state[slot] && state[slot].url) URL.revokeObjectURL(state[slot].url);
  state[slot] = null;
}

function markDrop(id, filled, previewUrl) {
  const el = document.getElementById(id);
  el.classList.toggle("filled", filled);
  let img = el.querySelector("img.preview");
  if (!filled) {
    if (img) img.remove();
    return;
  }
  if (!img) {
    img = document.createElement("img");
    img.className = "preview";
    img.alt = "";
    el.appendChild(img);
  }
  img.src = previewUrl;
}

function ready() {
  return Boolean(state.before && state.after);
}

function render() {
  const can = ready();
  slider.disabled = !can;
  swapBtn.disabled = !can;
  pngBtn.disabled = !can;
  htmlBtn.disabled = !can;

  if (!can) {
    stage.className = "stage empty";
    stage.textContent = "Drop both images to compare";
    stage.style.removeProperty("--cut");
    return;
  }

  stage.className = "stage";
  stage.textContent = "";
  stage.style.setProperty("--cut", state.cut + "%");
  stage.innerHTML =
    '<div class="layer before"></div>' +
    '<div class="layer after"></div>' +
    '<div class="handle"></div>' +
    '<span class="tag before">Before</span>' +
    '<span class="tag after">After</span>';
  stage.querySelector(".before").style.backgroundImage = "url(" + state.before.url + ")";
  stage.querySelector(".after").style.backgroundImage = "url(" + state.after.url + ")";
}

async function setSlot(slot, file) {
  setWarn("");
  try {
    const loaded = await loadImage(file);
    if (state[slot] && state[slot].url) URL.revokeObjectURL(state[slot].url);
    state[slot] = loaded;
    markDrop(slot === "before" ? "dropBefore" : "dropAfter", true, loaded.url);
    render();
  } catch (err) {
    setWarn(err.message);
  }
}

function bindDrop(el, input, slot) {
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.classList.add("over");
  });
  el.addEventListener("dragleave", () => el.classList.remove("over"));
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.classList.remove("over");
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) setSlot(slot, file);
  });
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (file) setSlot(slot, file);
    input.value = "";
  });
}

function pointerCut(e) {
  if (!ready()) return;
  const rect = stage.getBoundingClientRect();
  const x = (e.clientX ?? (e.touches && e.touches[0].clientX)) - rect.left;
  const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
  state.cut = pct;
  slider.value = String(Math.round(pct));
  stage.style.setProperty("--cut", pct + "%");
}

function drawCover(ctx, img, w, h) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, w, h);
}

function canvasPair() {
  const a = state.before.img;
  const b = state.after.img;
  // canvas takes the before image's shape; both images are cover-fit into it
  let w = Math.min(a.naturalWidth, 2000);
  let h = Math.round((a.naturalHeight * w) / a.naturalWidth);
  if (h > 2000) {
    w = Math.round((w * 2000) / h);
    h = 2000;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  drawCover(ctx, a, w, h);
  const cutX = Math.round((state.cut / 100) * w);
  ctx.save();
  ctx.beginPath();
  ctx.rect(cutX, 0, w - cutX, h);
  ctx.clip();
  drawCover(ctx, b, w, h);
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cutX - 1, 0, 2, h);
  return canvas;
}

function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not encode " + file.name));
    reader.readAsDataURL(file);
  });
}

bindDrop(document.getElementById("dropBefore"), document.getElementById("fileBefore"), "before");
bindDrop(document.getElementById("dropAfter"), document.getElementById("fileAfter"), "after");

document.getElementById("pickBefore").addEventListener("click", () => {
  document.getElementById("fileBefore").click();
});
document.getElementById("pickAfter").addEventListener("click", () => {
  document.getElementById("fileAfter").click();
});

slider.addEventListener("input", () => {
  state.cut = Number(slider.value);
  if (ready()) stage.style.setProperty("--cut", state.cut + "%");
});

let dragging = false;
stage.addEventListener("pointerdown", (e) => {
  if (!ready()) return;
  dragging = true;
  stage.setPointerCapture(e.pointerId);
  pointerCut(e);
});
stage.addEventListener("pointermove", (e) => {
  if (dragging) pointerCut(e);
});
stage.addEventListener("pointerup", () => {
  dragging = false;
});

swapBtn.addEventListener("click", () => {
  const tmp = state.before;
  state.before = state.after;
  state.after = tmp;
  markDrop("dropBefore", Boolean(state.before), state.before && state.before.url);
  markDrop("dropAfter", Boolean(state.after), state.after && state.after.url);
  render();
});

pngBtn.addEventListener("click", () => {
  if (!ready()) return;
  canvasPair().toBlob(
    (blob) => {
      if (!blob) {
        setWarn("Could not build PNG");
        return;
      }
      downloadBlob(blob, "thennow.png");
    },
    "image/png"
  );
});

htmlBtn.addEventListener("click", async () => {
  if (!ready()) return;
  setWarn("");
  try {
    const [b64a, b64b] = await Promise.all([
      fileToDataUrl(state.before.file),
      fileToDataUrl(state.after.file),
    ]);
    const page =
      "<!doctype html><meta charset='utf-8'><title>ThenNow</title>" +
      "<style>html,body{margin:0;height:100%;background:#111}#s{position:relative;height:100%;overflow:hidden}" +
      ".l{position:absolute;inset:0;background-size:contain;background-repeat:no-repeat;background-position:center}" +
      "#n{position:absolute;inset:0;clip-path:inset(0 0 0 " + Math.round(state.cut) + "%)}</style>" +
      "<div id=s><div class=l style='background-image:url(" +
      b64a +
      ")'></div><div class=l id=n style='background-image:url(" +
      b64b +
      ")'></div></div>" +
      "<script>const n=document.getElementById('n');addEventListener('pointermove',e=>{" +
      "n.style.clipPath='inset(0 0 0 '+(e.clientX/innerWidth*100)+'%)'});</script>";
    downloadBlob(new Blob([page], { type: "text/html" }), "thennow.html");
  } catch (err) {
    setWarn(err.message);
  }
});

document.getElementById("clear").addEventListener("click", () => {
  revoke("before");
  revoke("after");
  markDrop("dropBefore", false);
  markDrop("dropAfter", false);
  state.cut = 50;
  slider.value = "50";
  setWarn("");
  render();
});

render();
