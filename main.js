/* ============================================================
   main.js — shared behavior
   1) Hamburger menu          4) Lanyard card physics + flip
   2) Scroll-reveal           5) Eyes track the cursor
   3) Typewriter roles        6) Draw on the background
   ============================================================ */

/* ---------- 1) Hamburger menu ---------- */
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");

if (toggle && links) {
  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
    const isOpen = links.classList.contains("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "close" : "menu";
  });
}

/* ---------- 2) Scroll reveal ---------- */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

/* ---------- 3) Typewriter ---------- */
const typed = document.getElementById("typed");
/* PLACEHOLDER: edit these to change the rotating words */
const roles = [
  "AARON",
  "a Computer Engineer",
  "an FPGA Tinkerer",
  "an Embedded Dev",
  "a Hackathon Winner 🏆",
];

if (typed) {
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const word = roles[roleIndex];

    if (!deleting) {
      charIndex++;
      typed.textContent = word.slice(0, charIndex);
      if (charIndex === word.length) {
        deleting = true;
        setTimeout(tick, 1600);
        return;
      }
      setTimeout(tick, 90);
    } else {
      charIndex--;
      typed.textContent = word.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
      setTimeout(tick, 45);
    }
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typed.textContent = roles[0];
  } else {
    tick();
  }
}

/* ---------- 4) Lanyard ID card physics ---------- */
/*
   Pivot = top of the lanyard. Drag rotates the card toward your
   pointer; release triggers a damped spring back to center.

   DIRECTION NOTE (the bug we fixed): in screen coordinates a
   positive CSS rotation is CLOCKWISE, which swings an object
   hanging BELOW the pivot to the LEFT. So to make the card follow
   the pointer, the angle must be NEGATED: pointer left of pivot
   (dx < 0) → positive rotation → card bottom swings left. ✔
*/
const badgeWrap = document.getElementById("badgeWrap");
const badge = document.getElementById("badge");

if (badgeWrap && badge) {
  let angle = 0;
  let velocity = 0;
  let ty = 0;            // vertical offset (drag up/down)
  let tyVel = 0;         // vertical spring velocity
  let dragging = false;
  let pivotX = 0;
  let pivotY = 0;
  let grabY = 0;         // pointer Y at grab time
  let baseTy = 0;
  let moved = 0;
  let rafId = null;

  const setTransform = () => {
    badgeWrap.style.transform = `translateY(${ty}px) rotate(${angle}deg)`;
  };

  const stopIdleSway = () => badgeWrap.classList.add("held");
  const startIdleSway = () => {
    badgeWrap.classList.remove("held");
    badgeWrap.style.transform = "";
  };

  /* two independent springs: one for rotation, one for vertical pull */
  const springBack = () => {
    velocity += -0.06 * angle;
    velocity *= 0.92;
    angle += velocity;

    tyVel += -0.08 * ty;
    tyVel *= 0.88;
    ty += tyVel;

    setTransform();

    const settled =
      Math.abs(angle) < 0.3 && Math.abs(velocity) < 0.3 &&
      Math.abs(ty) < 0.5 && Math.abs(tyVel) < 0.5;

    if (!settled) {
      rafId = requestAnimationFrame(springBack);
    } else {
      angle = 0; velocity = 0; ty = 0; tyVel = 0;
      startIdleSway();
    }
  };

  badge.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    badge.setPointerCapture(e.pointerId);
    dragging = true;
    moved = 0;
    grabY = e.clientY;
    baseTy = ty;

    if (rafId) cancelAnimationFrame(rafId);
    stopIdleSway();

    const rect = badgeWrap.getBoundingClientRect();
    pivotX = rect.left + rect.width / 2;
    pivotY = rect.top - ty; // pivot in "resting" coordinates
    setTransform();
  });

  badge.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moved += Math.abs(e.movementX) + Math.abs(e.movementY);

    /* vertical pull — like stretching the lanyard */
    const prevTy = ty;
    ty = Math.max(-60, Math.min(170, baseTy + (e.clientY - grabY)));
    tyVel = ty - prevTy;

    /* rotation toward the pointer (sign negated — see note above) */
    const dx = e.clientX - pivotX;
    const dy = Math.max(e.clientY - pivotY, 40);
    const prev = angle;
    angle = -Math.max(-70, Math.min(70, (Math.atan2(dx, dy) * 180) / Math.PI));
    velocity = angle - prev;
    setTransform();
  });

  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    badge.releasePointerCapture?.(e.pointerId);

    if (moved < 8) {
      badge.classList.toggle("flipped");
    }
    rafId = requestAnimationFrame(springBack);
  };

  badge.addEventListener("pointerup", release);
  badge.addEventListener("pointercancel", release);

  badge.setAttribute("tabindex", "0");
  badge.setAttribute("role", "button");
  badge.setAttribute("aria-label", "ID card — press Enter to flip");
  badge.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      badge.classList.toggle("flipped");
    }
  });
}

/* ---------- 5) Eyes track the cursor ---------- */
/*
   For each pupil: find its eye's center on screen (viewBox coords
   scaled to the rendered SVG size), point a tiny vector toward the
   cursor, clamp it so the pupil stays inside the glasses lens.
*/
const charSvg = document.querySelector(".badge-char");
const pupils = charSvg ? charSvg.querySelectorAll(".pupil") : [];

if (pupils.length) {
  const VIEW_W = 126;
  const VIEW_H = 118;
  const MAX_SHIFT = 2.6; // viewBox units — keeps pupils inside the lens

  document.addEventListener("pointermove", (e) => {
    const rect = charSvg.getBoundingClientRect();
    if (!rect.width) return;
    const scaleX = rect.width / VIEW_W;
    const scaleY = rect.height / VIEW_H;

    pupils.forEach((pupil) => {
      const eyeX = rect.left + Number(pupil.dataset.cx) * scaleX;
      const eyeY = rect.top + Number(pupil.dataset.cy) * scaleY;
      const dx = e.clientX - eyeX;
      const dy = e.clientY - eyeY;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = (dx / dist) * MAX_SHIFT;
      const uy = (dy / dist) * MAX_SHIFT;
      pupil.setAttribute("transform", `translate(${ux.toFixed(2)}, ${uy.toFixed(2)})`);
    });
  });
}

/* ---------- 6) Draw on the background ---------- */
/*
   Two layers:
   - an OFFSCREEN "art" canvas holds everything permanent
     (finished strokes + dried paint splatter)
   - the VISIBLE canvas shows art + any live particles

   Every new stroke gets the next color from the palette.
   A click (press with almost no movement) on empty space
   triggers a pigment explosion: particles burst outward,
   and where each one dies it stamps a splat into the art.
*/
const canvas = document.getElementById("drawCanvas");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const art = document.createElement("canvas");
  const artCtx = art.getContext("2d");

  const PALETTE = ["#ff6a5c", "#2c4fd8", "#17a34a", "#8b5cf6", "#f59e0b", "#ec4899", "#171a2b"];
  let colorIndex = 0;
  let strokeColor = PALETTE[0];

  let drawing = false;
  let strokeMoved = 0;
  let downPoint = null;
  const particles = [];
  let rafId = null;

  const blit = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(art, 0, 0);
  };

  const resize = () => {
    const snapshot = document.createElement("canvas");
    snapshot.width = art.width || 1;
    snapshot.height = art.height || 1;
    snapshot.getContext("2d").drawImage(art, 0, 0);

    canvas.width = art.width = window.innerWidth;
    canvas.height = art.height = window.innerHeight;
    artCtx.drawImage(snapshot, 0, 0);

    artCtx.lineWidth = 3;
    artCtx.lineCap = "round";
    artCtx.lineJoin = "round";
    blit();
  };
  resize();
  window.addEventListener("resize", resize);

  /* --- particle explosion --- */
  const explode = (x, y, color) => {
    const count = 26 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      const dir = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particles.push({
        x, y,
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed - 2,      // slight upward kick
        r: 2 + Math.random() * 4,
        life: 30 + Math.random() * 30,
        color,
      });
    }
    /* stamp a central blob immediately — the "impact" */
    artCtx.fillStyle = color;
    artCtx.beginPath();
    artCtx.arc(x, y, 7 + Math.random() * 5, 0, Math.PI * 2);
    artCtx.fill();

    if (!rafId) rafId = requestAnimationFrame(animateParticles);
  };

  const animateParticles = () => {
    blit();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;      // gravity
      p.vx *= 0.99;      // air drag
      p.life--;
      p.r *= 0.985;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(p.r, 0.5), 0, Math.PI * 2);
      ctx.fill();

      /* particle dies → dried splat joins the permanent art */
      if (p.life <= 0) {
        artCtx.fillStyle = p.color;
        artCtx.beginPath();
        artCtx.arc(p.x, p.y, Math.max(p.r, 1), 0, Math.PI * 2);
        artCtx.fill();
        particles.splice(i, 1);
      }
    }

    if (particles.length) {
      rafId = requestAnimationFrame(animateParticles);
    } else {
      rafId = null;
      blit();
    }
  };

  const isInteractive = (target) =>
    target.closest("a, button, input, textarea, .badge, .nav, .draw-ui, .chip, .ic, .pcb-board, .ic-tray");

  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (isInteractive(e.target)) return;

    /* SELECTION FIX: stop the browser from starting a text selection
       when a stroke begins over text — preventDefault cancels the
       native mousedown behavior, the body class blocks selection for
       the whole stroke, and any half-made selection is cleared */
    e.preventDefault();
    document.body.classList.add("no-select");
    window.getSelection?.().removeAllRanges();

    drawing = true;
    strokeMoved = 0;
    downPoint = { x: e.clientX, y: e.clientY };

    /* every stroke/click gets the next color in the cycle */
    strokeColor = PALETTE[colorIndex % PALETTE.length];
    colorIndex++;
    artCtx.strokeStyle = strokeColor;

    artCtx.beginPath();
    artCtx.moveTo(e.clientX, e.clientY);
  });

  document.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    strokeMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
    artCtx.lineTo(e.clientX, e.clientY);
    artCtx.stroke();
    if (!rafId) blit();   // particles already blit each frame
  });

  const stopDrawing = () => {
    document.body.classList.remove("no-select");
    if (!drawing) return;
    drawing = false;
    /* barely moved = a click → pigment explosion! */
    if (strokeMoved < 6 && downPoint) {
      explode(downPoint.x, downPoint.y, strokeColor);
    }
    downPoint = null;
  };
  document.addEventListener("pointerup", stopDrawing);
  document.addEventListener("pointercancel", stopDrawing);

  const clearBtn = document.getElementById("clearDraw");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      particles.length = 0;
      artCtx.clearRect(0, 0, art.width, art.height);
      blit();
    });
  }
}

/* ---------- 7) PCB skill lab (about page) ---------- */
/*
   12 skill ICs, 6 sockets. Drag an IC from the tray onto any empty
   socket; drag it off to return it to the tray. The CPU reads which
   CATEGORIES are plugged in and prints the matching job title.

   Categories: HW (hardware), SW (software), CLOUD, EMB (embedded).
*/
const pcbBoard = document.getElementById("pcbBoard");
const icTray = document.getElementById("icTray");
const chipTitle = document.getElementById("chipTitle");
const chipSub = document.getElementById("chipSub");

if (pcbBoard && icTray && chipTitle) {
  /* PLACEHOLDER: edit labels/categories/shapes freely.
     shapes: h = wide, v = vertical, sq = square, s = small rect */
  const SKILLS = [
    { label: "VERILOG",  cat: "HW",    shape: "h"  },
    { label: "VHDL",     cat: "HW",    shape: "v"  },
    { label: "FPGA",     cat: "HW",    shape: "sq" },
    { label: "PCB",      cat: "HW",    shape: "s"  },
    { label: "PYTHON",   cat: "SW",    shape: "h"  },
    { label: "C/C++",    cat: "SW",    shape: "s"  },
    { label: "REACT",    cat: "SW",    shape: "sq" },
    { label: "AWS",      cat: "CLOUD", shape: "s"  },
    { label: "DOCKER",   cat: "CLOUD", shape: "v"  },
    { label: "ESP32",    cat: "EMB",   shape: "sq" },
    { label: "FreeRTOS", cat: "EMB",   shape: "h"  },
    { label: "RISC-V",   cat: "EMB",   shape: "v"  },
  ];

  const sockets = [...pcbBoard.querySelectorAll(".socket")];

  /* build the ICs into the tray */
  SKILLS.forEach((skill) => {
    const ic = document.createElement("div");
    ic.className = `ic ic--${skill.shape}`;
    ic.dataset.cat = skill.cat;
    ic.textContent = skill.label;
    icTray.appendChild(ic);
  });

  /* --- title logic --- */
  const SOLO = {
    HW: "HARDWARE ENGINEER",
    SW: "SOFTWARE ENGINEER",
    CLOUD: "CLOUD ENGINEER",
    EMB: "EMBEDDED ENGINEER",
  };
  const PAIRS = {
    "EMB+HW": "FIRMWARE ENGINEER",
    "CLOUD+SW": "FULL-STACK ENGINEER",
    "HW+SW": "COMPUTER ENGINEER",
    "EMB+SW": "EMBEDDED SW ENGINEER",
    "CLOUD+EMB": "IoT ENGINEER",
    "CLOUD+HW": "SYSTEMS ENGINEER",
  };

  const updateChip = () => {
    const placed = sockets.filter((s) => s.querySelector(".ic"));
    const cats = new Set(placed.map((s) => s.querySelector(".ic").dataset.cat));

    let title;
    if (cats.size === 0) title = "PLUG IN SKILL ICs";
    else if (cats.size === 1) title = SOLO[[...cats][0]];
    else if (cats.size === 2) title = PAIRS[[...cats].sort().join("+")];
    else if (cats.size === 3) title = "SYSTEMS ENGINEER";
    else title = "SYSTEMS ARCHITECT 🏆";

    if (chipTitle.textContent !== title) {
      chipTitle.textContent = title;
      chipTitle.classList.remove("flash");
      void chipTitle.offsetWidth;        // restart the flash animation
      chipTitle.classList.add("flash");
    }
    chipSub.textContent = `${placed.length}/${sockets.length} sockets`;
  };

  /* --- drag & drop --- */
  let held = null;

  const grab = (e) => {
    const ic = e.target.closest(".ic");
    if (!ic) return;
    e.preventDefault();
    held = ic;
    ic.setPointerCapture(e.pointerId);
    ic.classList.add("dragging");

    /* lift it out of tray/socket onto the page so nothing clips it */
    const r = ic.getBoundingClientRect();
    document.body.appendChild(ic);
    ic.style.position = "fixed";
    ic.style.left = `${r.left}px`;
    ic.style.top = `${r.top}px`;
    ic.style.margin = "0";
    ic.style.transform = "none";
    updateChip();                        // socket it left is now empty
    moveTo(e);
  };

  const moveTo = (e) => {
    if (!held) return;
    held.style.left = `${e.clientX - held.offsetWidth / 2}px`;
    held.style.top = `${e.clientY - held.offsetHeight / 2}px`;

    /* highlight the empty socket under the pointer */
    sockets.forEach((s) => {
      const r = s.getBoundingClientRect();
      const over =
        e.clientX > r.left && e.clientX < r.right &&
        e.clientY > r.top && e.clientY < r.bottom;
      s.classList.toggle("hot", over && !s.querySelector(".ic"));
    });
  };

  const drop = (e) => {
    if (!held) return;
    const ic = held;
    held = null;
    ic.classList.remove("dragging");
    ic.releasePointerCapture?.(e.pointerId);

    /* find an empty socket under the pointer */
    const target = sockets.find((s) => {
      const r = s.getBoundingClientRect();
      return (
        e.clientX > r.left && e.clientX < r.right &&
        e.clientY > r.top && e.clientY < r.bottom &&
        !s.querySelector(".ic")
      );
    });

    /* reset inline positioning, then seat it */
    ic.style.position = "";
    ic.style.left = "";
    ic.style.top = "";
    ic.style.transform = "";

    (target || icTray).appendChild(ic);
    sockets.forEach((s) => s.classList.remove("hot"));
    updateChip();
  };

  icTray.addEventListener("pointerdown", grab);
  pcbBoard.addEventListener("pointerdown", grab);
  document.addEventListener("pointermove", moveTo);
  document.addEventListener("pointerup", drop);
  document.addEventListener("pointercancel", drop);

  updateChip();
}
