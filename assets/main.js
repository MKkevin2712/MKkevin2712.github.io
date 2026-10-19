// ---------- Thème clair / nuit ----------
const root = document.documentElement;
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function currentTheme() {
  return root.dataset.theme || (prefersDark.matches ? "dark" : "light");
}

document.getElementById("theme-toggle").addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// ---------- Menu mobile ----------
const dock = document.querySelector(".dock");
const menuBtn = document.getElementById("menu-toggle");
menuBtn.addEventListener("click", () => {
  const open = dock.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll(".dock-links a").forEach((a) =>
  a.addEventListener("click", () => {
    dock.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);

// ---------- Apparition au défilement + lien actif ----------
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      io.unobserve(e.target);
    }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

const links = [...document.querySelectorAll(".dock-links a")];
const spy = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) {
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
    }
  }),
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

// ---------- Compteurs animés ----------
const fmt = (v, d) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const counters = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseFloat(el.dataset.count);
    const d = parseInt(el.dataset.decimals || "0", 10);
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const t0 = performance.now(), dur = 1200;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(target * eased, d) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    counters.unobserve(el);
  }),
  { threshold: 0.6 }
);
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll("[data-count]").forEach((el) => counters.observe(el));
}

// ---------- Formulaire : ouvre la messagerie ----------
document.getElementById("contact-form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const subject = `Contact depuis le portfolio – ${f.get("nom")}`;
  const body = `${f.get("message")}\n\n${f.get("nom")} (${f.get("email")})`;
  window.location.href =
    "mailto:kevinnkameni@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
});

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Onglets du parcours ----------
const tabs = [...document.querySelectorAll(".tab")];
tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", String(on));
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !on;
      panel.classList.toggle("show", on);
      if (on) panel.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
    });
  })
);

// ---------- Bouton « remonter » ----------
const toTop = document.getElementById("to-top");
const onScroll = () => toTop.classList.toggle("visible", window.scrollY > 600);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------- Sphère de chiffres (réagit à la souris et au clic) ----------
(function sphere() {
  const canvas = document.getElementById("sphere");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const N = 1100, golden = Math.PI * (3 - Math.sqrt(5));
  const base = new Float32Array(N * 3);   // positions sur la sphère unité
  const off = new Float32Array(N * 2);    // décalage écran actuel (lissé)
  const vel = new Float32Array(N * 2);    // vitesse (effet ressort)
  const digit = new Uint8Array(N);
  for (let i = 0; i < N; i++) {           // répartition uniforme (spirale de Fibonacci)
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
    base[i * 3] = Math.cos(th) * r; base[i * 3 + 1] = y; base[i * 3 + 2] = Math.sin(th) * r;
    digit[i] = (Math.random() * 10) | 0;
  }

  // Chiffres pré-dessinés (une image par chiffre), redessinés si la couleur change
  const sprites = []; let spriteColor = "", spritePx = 0;
  function makeSprites(color, px) {
    for (let d = 0; d < 10; d++) {
      const c = sprites[d] || document.createElement("canvas");
      c.width = c.height = px;
      const g = c.getContext("2d");
      g.clearRect(0, 0, px, px);
      g.fillStyle = color;
      g.font = `600 ${px * 0.9}px "Fira Code", ui-monospace, Consolas, monospace`;
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(d), px / 2, px / 2 + px * 0.05);
      sprites[d] = c;
    }
    spriteColor = color; spritePx = px;
  }

  let size = 0, dpr = 1, angle = 0, spin = 0.003, tiltX = 0.3, visible = true;
  const mouse = { x: 0, y: 0, px: 0, in: false };
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = canvas.clientWidth;
    canvas.width = canvas.height = size * dpr;
    spriteColor = "";
  };
  resize();
  window.addEventListener("resize", resize);
  const zone = canvas.parentElement;
  zone.addEventListener("pointermove", (e) => {
    const b = canvas.getBoundingClientRect();
    const nx = (e.clientX - b.left) * dpr;
    if (mouse.in) spin += (nx - mouse.x) * 0.00002;      // la souris entraîne la rotation
    mouse.x = nx; mouse.y = (e.clientY - b.top) * dpr; mouse.in = true;
  });
  zone.addEventListener("pointerleave", () => { mouse.in = false; });
  zone.addEventListener("pointerdown", (e) => {          // clic : onde de choc
    const b = canvas.getBoundingClientRect();
    const cx = (e.clientX - b.left) * dpr, cy = (e.clientY - b.top) * dpr;
    blast = { x: cx, y: cy, t: 0 };
  });
  let blast = null;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function draw() {
    if (visible || reduce) {
      const color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#6c5ce7";
      const W = size * dpr, R = W * 0.4, c = W / 2;
      const glyph = Math.max(8, Math.round(W * 0.026));
      if (color !== spriteColor || glyph !== spritePx) makeSprites(color, glyph);
      const reach = W * 0.26, push = W * 0.16;           // zone d'influence large et forte
      ctx.clearRect(0, 0, W, W);
      const ca = Math.cos(angle), sa = Math.sin(angle), ct = Math.cos(tiltX), st = Math.sin(tiltX);
      if (blast) blast.t += 1;
      for (let i = 0; i < N; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
        const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
        const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        const depth = (z2 + 1) / 2;
        let px = c + x1 * R, py = c + y2 * R;
        let fx = 0, fy = 0;
        if (mouse.in) {
          const dx = px - mouse.x, dy = py - mouse.y, d = Math.hypot(dx, dy);
          if (d < reach && d > 0.01) {
            const f = (1 - d / reach) ** 1.6 * push * (0.5 + depth);
            fx = (dx / d) * f; fy = (dy / d) * f;
          }
        }
        if (blast && blast.t < 40) {                     // onde qui s'éloigne du clic
          const dx = px - blast.x, dy = py - blast.y, d = Math.hypot(dx, dy) || 1;
          const front = blast.t * W * 0.03, band = W * 0.12;
          const k = Math.max(0, 1 - Math.abs(d - front) / band) * (1 - blast.t / 40);
          fx += (dx / d) * k * W * 0.2; fy += (dy / d) * k * W * 0.2;
        }
        // ressort amorti : réaction vive, retour élastique
        const j = i * 2;
        vel[j] = (vel[j] + (fx - off[j]) * 0.22) * 0.72;
        vel[j + 1] = (vel[j + 1] + (fy - off[j + 1]) * 0.22) * 0.72;
        off[j] += vel[j]; off[j + 1] += vel[j + 1];
        px += off[j]; py += off[j + 1];
        if (Math.random() < 0.002) digit[i] = (Math.random() * 10) | 0;   // les chiffres changent
        const s = glyph * (0.45 + depth * 0.75);
        ctx.globalAlpha = 0.1 + depth * 0.85;
        ctx.drawImage(sprites[digit[i]], px - s / 2, py - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      if (blast && blast.t >= 40) blast = null;
      spin += (0.003 - spin) * 0.02;                     // revient à la vitesse normale
      angle += spin;
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  draw();
})();

// ---------- Rôles qui défilent sous le nom ----------
(function roles() {
  const el = document.getElementById("role-text");
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const list = ["Modélisation du risque de crédit", "Data science & machine learning", "Data engineering · SQL · dbt", "Data Scientist · Analyse des risques"];
  let i = list.length - 1, n = list[i].length, del = true;
  (function tick() {
    const word = list[i];
    n += del ? -1 : 1;
    el.textContent = word.slice(0, n);
    let wait = del ? 28 : 55;
    if (!del && n === word.length) { del = true; wait = 2200; }
    else if (del && n === 0) { del = false; i = (i + 1) % list.length; wait = 300; }
    setTimeout(tick, wait);
  })();
})();

// ---------- Curseur personnalisé (point + anneau, ordinateurs uniquement) ----------
(function cursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dot = document.createElement("div"), ring = document.createElement("div");
  dot.className = "cursor-dot"; ring.className = "cursor-ring";
  document.body.append(dot, ring);
  document.documentElement.classList.add("has-cursor");
  let x = -100, y = -100, rx = -100, ry = -100;
  window.addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    const hot = e.target.closest("a, button, input, textarea, .tab");
    ring.classList.toggle("hot", !!hot);
  });
  document.addEventListener("pointerleave", () => { x = y = -100; });
  (function follow() {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  })();
})();
