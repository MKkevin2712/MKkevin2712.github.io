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

// ---------- Sphère de points animée (repoussée par la souris) ----------
(function sphere() {
  const canvas = document.getElementById("sphere");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const N = 2600, golden = Math.PI * (3 - Math.sqrt(5));
  const base = new Float32Array(N * 3);   // positions sur la sphère unité
  const off = new Float32Array(N * 2);    // décalage écran actuel de chaque point (lissé)
  for (let i = 0; i < N; i++) {           // répartition uniforme (spirale de Fibonacci)
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
    base[i * 3] = Math.cos(th) * r; base[i * 3 + 1] = y; base[i * 3 + 2] = Math.sin(th) * r;
  }
  let size = 0, dpr = 1, angle = 0, visible = true;
  const tilt = 0.3, mouse = { x: 0, y: 0, in: false };
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = canvas.clientWidth;
    canvas.width = canvas.height = size * dpr;
  };
  resize();
  window.addEventListener("resize", resize);
  const zone = canvas.parentElement;
  zone.addEventListener("pointermove", (e) => {
    const b = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - b.left) * dpr; mouse.y = (e.clientY - b.top) * dpr; mouse.in = true;
  });
  zone.addEventListener("pointerleave", () => { mouse.in = false; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function draw() {
    if (visible || reduce) {
      const color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2f71a0";
      const W = size * dpr, R = W * 0.4, c = W / 2;
      const reach = W * 0.16, push = W * 0.07;   // rayon d'influence et force de la souris
      ctx.clearRect(0, 0, W, W);
      ctx.fillStyle = color;
      const ca = Math.cos(angle), sa = Math.sin(angle), ct = Math.cos(tilt), st = Math.sin(tilt);
      for (let i = 0; i < N; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
        const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;   // rotation
        const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;  // inclinaison
        let px = c + x1 * R, py = c + y2 * R;
        // cible du décalage : repoussé à l'écart du curseur
        let tx = 0, ty = 0;
        if (mouse.in) {
          const dx = px - mouse.x, dy = py - mouse.y, d = Math.hypot(dx, dy);
          if (d < reach && d > 0.01) {
            const f = (1 - d / reach) ** 2 * push;
            tx = (dx / d) * f; ty = (dy / d) * f;
          }
        }
        off[i * 2] += (tx - off[i * 2]) * 0.12;            // retour élastique
        off[i * 2 + 1] += (ty - off[i * 2 + 1]) * 0.12;
        px += off[i * 2]; py += off[i * 2 + 1];
        const depth = (z2 + 1) / 2;                        // 0 = fond, 1 = devant
        ctx.globalAlpha = 0.12 + depth * 0.7;
        const s = (0.5 + depth * 1.0) * dpr;
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      angle += 0.0025;
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  draw();
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
