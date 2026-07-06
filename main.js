/* ============================================================
   AARON — portfolio scripts
   ------------------------------------------------------------
   Everything you'd normally want to change lives in CONFIG,
   right below. The rest is behavior, organized in sections:

     1. Navigation (hamburger menu)
     2. Scroll-reveal animations
     3. Typewriter intro
     4. Lanyard ID card (drag physics + flip)
     5. Badge character eye tracking
     6. Background sketch layer (multi-color + explosions)
     7. Dev-board skill game (drag ICs, LCD title)
   ============================================================ */

/* ------------------------------------------------------------
   ✏ CONFIG — safe to edit, no code knowledge needed
   ------------------------------------------------------------ */
const CONFIG = {
  /* words the intro types after "Hi! I'm ..." */
  typewriterRoles: [
    "AARON",
    "a Computer Engineer",
    "a Hardware + Software Builder",
    "an Embedded & Edge AI Developer",
    "a Cloud-Native Problem Solver",
    "a UI/UX-Minded Engineer",
  ],

  /* pen colors for the background sketch layer (cycled per stroke) */
  penColors: ["#ff6a5c", "#2c4fd8", "#17a34a", "#8b5cf6", "#f59e0b", "#ec4899", "#171a2b"],

  /* skill ICs for the dev-board game (about page).
     cat: HW | SW | CLOUD | EMB   shape: h (wide) | sq (square) | s (small) */
  skills: [
    { label: "VERILOG",   cat: "HW",    shape: "h"  },
    { label: "VHDL",      cat: "HW",    shape: "s"  },
    { label: "PCB",       cat: "HW",    shape: "sq" },
    { label: "RF",        cat: "HW",    shape: "s"  },
    { label: "PYTHON",    cat: "SW",    shape: "h"  },
    { label: "C/C++",     cat: "SW",    shape: "s"  },
    { label: "JAVA",      cat: "SW",    shape: "sq" },
    { label: "REACT",     cat: "SW",    shape: "s"  },
    { label: "SQL",       cat: "SW",    shape: "sq" },
    { label: "AWS",       cat: "CLOUD", shape: "s"  },
    { label: "DOCKER",    cat: "CLOUD", shape: "h"  },
    { label: "SNOWFLAKE", cat: "CLOUD", shape: "h"  },
    { label: "ESP32",     cat: "EMB",   shape: "sq" },
    { label: "FreeRTOS",  cat: "EMB",   shape: "h"  },
    { label: "SPI·I2C",   cat: "EMB",   shape: "s"  },
    { label: "EDGE AI",   cat: "EMB",   shape: "sq" },
  ],

  /* the "Say hi" counter on the ID card back.
     Uses the free Abacus counter API (abacus.jasoncameron.dev) —
     no account needed; the namespace/key pair just has to be unique
     to this site. If the API is unreachable the counter hides itself. */
  hiCounter: {
    namespace: "aaron-abulala1-portfolio",
    key: "say-hi",
  },

  /* job titles the LCD shows, based on which categories are plugged in */
  titles: {
    empty: "PLUG IN SKILL ICs",
    solo: {
      HW: "HARDWARE ENGINEER",
      SW: "SOFTWARE ENGINEER",
      CLOUD: "CLOUD ENGINEER",
      EMB: "EMBEDDED ENGINEER",
    },
    pairs: {
      "EMB+HW": "FIRMWARE ENGINEER",
      "CLOUD+SW": "FULL-STACK ENGINEER",
      "HW+SW": "COMPUTER ENGINEER",
      "EMB+SW": "EMBEDDED SW ENGINEER",
      "CLOUD+EMB": "IoT ENGINEER",
      "CLOUD+HW": "SYSTEMS ENGINEER",
    },
    threeCats: "SYSTEMS ENGINEER",
    fourCats: "SYSTEMS ARCHITECT 🏆",
  },
};

/* elements that should never trigger the sketch layer */
const INTERACTIVE_SELECTOR =
  "a, button, input, textarea, .badge, .nav, .draw-ui, .ic, .pcb-board, .ic-tray";

const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================
   1. Navigation — hamburger menu on small screens
   ============================================================ */
(() => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "close" : "menu";
  });
})();

/* ============================================================
   2. Scroll-reveal — fade elements in as they enter the viewport
   ============================================================ */
(() => {
  const revealables = document.querySelectorAll(".reveal");
  if (!revealables.length) return;

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

  revealables.forEach((el) => observer.observe(el));
})();

/* ============================================================
   3. Typewriter — types and erases each role in turn
   ============================================================ */
(() => {
  const typed = document.getElementById("typed");
  if (!typed) return;

  const roles = CONFIG.typewriterRoles;

  if (prefersReducedMotion) {
    typed.textContent = roles[0]; // static fallback
    return;
  }

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const TYPE_MS = 90;
  const ERASE_MS = 45;
  const HOLD_MS = 1600;

  const tick = () => {
    const word = roles[roleIndex];

    if (!deleting) {
      charIndex += 1;
      typed.textContent = word.slice(0, charIndex);
      if (charIndex === word.length) {
        deleting = true;
        setTimeout(tick, HOLD_MS);
        return;
      }
      setTimeout(tick, TYPE_MS);
    } else {
      charIndex -= 1;
      typed.textContent = word.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
      setTimeout(tick, ERASE_MS);
    }
  };

  tick();
})();

/* ============================================================
   4. Lanyard ID card — drag physics + click to flip
   ------------------------------------------------------------
   The whole assembly pivots at the lanyard's top. Dragging
   rotates it toward the pointer AND lets you pull it up/down;
   releasing hands control to two damped springs (one for
   rotation, one for vertical stretch) that swing it home.

   Rotation sign: positive CSS rotation is CLOCKWISE, which
   moves a hanging object's bottom to the LEFT — so the angle
   from atan2 must be negated for the card to follow the hand.
   ============================================================ */
(() => {
  const wrap = document.getElementById("badgeWrap");
  const badge = document.getElementById("badge");
  if (!wrap || !badge) return;

  /* physics state */
  let angle = 0, angleVel = 0;   // rotation spring
  let ty = 0, tyVel = 0;         // vertical spring
  let dragging = false;
  let pivotX = 0, pivotY = 0;
  let grabY = 0, baseTy = 0;
  let pointerTravel = 0;         // distinguishes click from drag
  let rafId = null;

  const CLICK_THRESHOLD = 8;     // px of travel below which it's a "click"
  const MAX_ANGLE = 70;          // deg
  const PULL_RANGE = { up: -60, down: 170 }; // px

  const applyTransform = () => {
    wrap.style.transform = `translateY(${ty}px) rotate(${angle}deg)`;
  };

  const pauseIdleSway = () => wrap.classList.add("held");
  const resumeIdleSway = () => {
    wrap.classList.remove("held");
    wrap.style.transform = "";
  };

  const springBack = () => {
    angleVel += -0.06 * angle;   // spring force toward 0
    angleVel *= 0.92;            // damping
    angle += angleVel;

    tyVel += -0.08 * ty;
    tyVel *= 0.88;
    ty += tyVel;

    applyTransform();

    const settled =
      Math.abs(angle) < 0.3 && Math.abs(angleVel) < 0.3 &&
      Math.abs(ty) < 0.5 && Math.abs(tyVel) < 0.5;

    if (settled) {
      angle = angleVel = ty = tyVel = 0;
      rafId = null;
      resumeIdleSway();
    } else {
      rafId = requestAnimationFrame(springBack);
    }
  };

  badge.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    badge.setPointerCapture(e.pointerId);
    dragging = true;
    pointerTravel = 0;
    grabY = e.clientY;
    baseTy = ty;

    if (rafId) cancelAnimationFrame(rafId);
    pauseIdleSway();

    const rect = wrap.getBoundingClientRect();
    pivotX = rect.left + rect.width / 2;
    pivotY = rect.top - ty; // pivot in resting coordinates
    applyTransform();
  });

  badge.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    pointerTravel += Math.abs(e.movementX) + Math.abs(e.movementY);

    /* vertical pull, like stretching the lanyard */
    const prevTy = ty;
    ty = Math.max(PULL_RANGE.up, Math.min(PULL_RANGE.down, baseTy + (e.clientY - grabY)));
    tyVel = ty - prevTy;

    /* rotation toward the pointer (negated — see note above) */
    const dx = e.clientX - pivotX;
    const dy = Math.max(e.clientY - pivotY, 40); // avoid wild flips near pivot
    const prevAngle = angle;
    angle = -Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, (Math.atan2(dx, dy) * 180) / Math.PI));
    angleVel = angle - prevAngle; // carry momentum into the release
    applyTransform();
  });

  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    badge.releasePointerCapture?.(e.pointerId);

    if (pointerTravel < CLICK_THRESHOLD) {
      badge.classList.toggle("flipped");
    }
    rafId = requestAnimationFrame(springBack);
  };

  badge.addEventListener("pointerup", release);
  badge.addEventListener("pointercancel", release);

  /* keyboard access: Enter / Space flips the card */
  badge.setAttribute("tabindex", "0");
  badge.setAttribute("role", "button");
  badge.setAttribute("aria-label", "ID card — press Enter to flip");
  badge.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      badge.classList.toggle("flipped");
    }
  });
})();

/* ============================================================
   5. Eye tracking — the badge character watches the cursor
   ============================================================ */
(() => {
  const svg = document.querySelector(".badge-char");
  if (!svg) return;
  const pupils = svg.querySelectorAll(".pupil");
  if (!pupils.length) return;

  const VIEW_W = 126;
  const VIEW_H = 118;
  const MAX_SHIFT = 2.6; // viewBox units — keeps pupils inside the lens

  document.addEventListener("pointermove", (e) => {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;

    pupils.forEach((pupil) => {
      const eyeX = rect.left + Number(pupil.dataset.cx) * (rect.width / VIEW_W);
      const eyeY = rect.top + Number(pupil.dataset.cy) * (rect.height / VIEW_H);
      const dx = e.clientX - eyeX;
      const dy = e.clientY - eyeY;
      const dist = Math.hypot(dx, dy) || 1;
      pupil.setAttribute(
        "transform",
        `translate(${((dx / dist) * MAX_SHIFT).toFixed(2)}, ${((dy / dist) * MAX_SHIFT).toFixed(2)})`
      );
    });
  });
})();

/* ============================================================
   6. Background sketch layer
   ------------------------------------------------------------
   Two canvases:
     - "art" (offscreen) holds permanent ink: strokes + dried splats
     - the visible canvas shows art + any live explosion particles

   Every stroke cycles to the next pen color. A click on empty
   space (a press that barely moves) bursts into particles that
   stamp splatter into the art where they land.

   BUGFIX: each stroke segment is drawn as its own isolated path
   (beginPath → moveTo(last) → lineTo(now)). Previously the
   stroke shared one long-lived path with the particle splats,
   so a splat's arc() hijacked the current point and the next
   segment shot out from the explosion — the "fan of lines" bug.
   ============================================================ */
(() => {
  const canvas = document.getElementById("drawCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const art = document.createElement("canvas");
  const artCtx = art.getContext("2d");

  let colorIndex = 0;
  let strokeColor = CONFIG.penColors[0];
  let drawing = false;
  let lastPoint = null;   // previous stroke point (the bugfix anchor)
  let strokeTravel = 0;
  let pressPoint = null;
  const particles = [];
  let rafId = null;

  const CLICK_THRESHOLD = 6; // px — below this, a press counts as a click

  const blit = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(art, 0, 0);
  };

  const resize = () => {
    /* preserve the existing drawing through a resize */
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

  /* --- explosion particles --- */
  const spawnExplosion = (x, y, color) => {
    const count = 26 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      const dir = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particles.push({
        x, y,
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed - 2, // slight upward kick
        r: 2 + Math.random() * 4,
        life: 30 + Math.random() * 30,
        color,
      });
    }

    /* the impact blob, stamped immediately */
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
      p.vy += 0.18;   // gravity
      p.vx *= 0.99;   // air drag
      p.life -= 1;
      p.r *= 0.985;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(p.r, 0.5), 0, Math.PI * 2);
      ctx.fill();

      /* a dead particle dries into permanent splatter */
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

  /* --- pointer handling --- */
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (e.target.closest(INTERACTIVE_SELECTOR)) return;

    /* stop the browser from starting a text selection mid-stroke */
    e.preventDefault();
    document.body.classList.add("no-select");
    window.getSelection?.().removeAllRanges();

    drawing = true;
    strokeTravel = 0;
    pressPoint = { x: e.clientX, y: e.clientY };
    lastPoint = pressPoint;

    strokeColor = CONFIG.penColors[colorIndex % CONFIG.penColors.length];
    colorIndex += 1;
  });

  document.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    strokeTravel += Math.abs(e.movementX) + Math.abs(e.movementY);

    /* each segment is its own path — immune to particle splats */
    const point = { x: e.clientX, y: e.clientY };
    artCtx.strokeStyle = strokeColor;
    artCtx.beginPath();
    artCtx.moveTo(lastPoint.x, lastPoint.y);
    artCtx.lineTo(point.x, point.y);
    artCtx.stroke();
    lastPoint = point;

    if (!rafId) blit(); // the particle loop already blits every frame
  });

  const endStroke = () => {
    document.body.classList.remove("no-select");
    if (!drawing) return;
    drawing = false;

    /* barely moved = a click → pigment explosion */
    if (strokeTravel < CLICK_THRESHOLD && pressPoint) {
      spawnExplosion(pressPoint.x, pressPoint.y, strokeColor);
    }
    pressPoint = null;
    lastPoint = null;
  };
  document.addEventListener("pointerup", endStroke);
  document.addEventListener("pointercancel", endStroke);

  const clearBtn = document.getElementById("clearDraw");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      particles.length = 0;
      artCtx.clearRect(0, 0, art.width, art.height);
      blit();
    });
  }
})();

/* ============================================================
   7. Dev-board skill game (about page)
   ------------------------------------------------------------
   Drag skill ICs from the tray into board sockets; the LCD reads
   which categories are plugged in and prints the matching title.
   ============================================================ */
(() => {
  const board = document.getElementById("pcbBoard");
  const tray = document.getElementById("icTray");
  const lcdTitle = document.getElementById("chipTitle");
  const lcdSub = document.getElementById("chipSub");
  if (!board || !tray || !lcdTitle) return;

  const sockets = [...board.querySelectorAll(".socket")];

  /* build the ICs into the tray from CONFIG */
  CONFIG.skills.forEach((skill) => {
    const ic = document.createElement("div");
    ic.className = `ic ic--${skill.shape}`;
    ic.dataset.cat = skill.cat;
    ic.textContent = skill.label;
    tray.appendChild(ic);
  });

  /* --- LCD title logic --- */
  const updateLcd = () => {
    const placed = sockets.filter((s) => s.querySelector(".ic"));
    const cats = new Set(placed.map((s) => s.querySelector(".ic").dataset.cat));
    const T = CONFIG.titles;

    let title;
    if (cats.size === 0) title = T.empty;
    else if (cats.size === 1) title = T.solo[[...cats][0]];
    else if (cats.size === 2) title = T.pairs[[...cats].sort().join("+")];
    else if (cats.size === 3) title = T.threeCats;
    else title = T.fourCats;

    if (lcdTitle.textContent !== title) {
      lcdTitle.textContent = title;
      lcdTitle.classList.remove("flash");
      void lcdTitle.offsetWidth; // restart the flash animation
      lcdTitle.classList.add("flash");
    }
    lcdSub.textContent = `${placed.length}/${sockets.length} sockets`;
  };

  /* --- drag & drop --- */
  let held = null;

  const socketUnder = (x, y) =>
    sockets.find((s) => {
      const r = s.getBoundingClientRect();
      return x > r.left && x < r.right && y > r.top && y < r.bottom;
    });

  const grab = (e) => {
    const ic = e.target.closest(".ic");
    if (!ic) return;
    e.preventDefault();
    held = ic;
    ic.setPointerCapture(e.pointerId);
    ic.classList.add("dragging");

    /* lift it onto the page layer so nothing clips it while moving */
    const r = ic.getBoundingClientRect();
    document.body.appendChild(ic);
    Object.assign(ic.style, {
      position: "fixed",
      left: `${r.left}px`,
      top: `${r.top}px`,
      margin: "0",
      transform: "none",
    });

    updateLcd(); // the socket it left is now empty
    follow(e);
  };

  const follow = (e) => {
    if (!held) return;
    held.style.left = `${e.clientX - held.offsetWidth / 2}px`;
    held.style.top = `${e.clientY - held.offsetHeight / 2}px`;

    /* glow the empty socket under the pointer */
    const hover = socketUnder(e.clientX, e.clientY);
    sockets.forEach((s) =>
      s.classList.toggle("hot", s === hover && !s.querySelector(".ic"))
    );
  };

  const drop = (e) => {
    if (!held) return;
    const ic = held;
    held = null;
    ic.classList.remove("dragging");
    ic.releasePointerCapture?.(e.pointerId);

    const target = socketUnder(e.clientX, e.clientY);
    const seatIn = target && !target.querySelector(".ic") ? target : tray;

    Object.assign(ic.style, { position: "", left: "", top: "", transform: "" });
    seatIn.appendChild(ic);

    sockets.forEach((s) => s.classList.remove("hot"));
    updateLcd();
  };

  tray.addEventListener("pointerdown", grab);
  board.addEventListener("pointerdown", grab);
  document.addEventListener("pointermove", follow);
  document.addEventListener("pointerup", drop);
  document.addEventListener("pointercancel", drop);

  updateLcd();
})();

/* ============================================================
   8. "Say hi" counter (ID card back)
   ------------------------------------------------------------
   A shared, global click count needs a server; since this site
   is static, we use the free Abacus counter API:
     GET .../get/{ns}/{key}  → read the count (404 until first hit)
     GET .../hit/{ns}/{key}  → increment and return the count
   One hi per browser (remembered in localStorage) to keep the
   number honest. If the API is unreachable, the count line
   simply stays hidden and nothing breaks.
   ============================================================ */
(() => {
  const btn = document.getElementById("sayHiBtn");
  const label = document.getElementById("hiCount");
  if (!btn || !label) return;

  const { namespace, key } = CONFIG.hiCounter;
  const BASE = "https://abacus.jasoncameron.dev";
  const GET_URL = `${BASE}/get/${namespace}/${key}`;
  const HIT_URL = `${BASE}/hit/${namespace}/${key}`;
  const STORAGE_KEY = "aaron-said-hi";

  const showCount = (n) => {
    label.textContent =
      n === 1 ? "1 person said hi" : `${n.toLocaleString()} people said hi`;
  };

  const markSaid = () => {
    btn.textContent = "You said hi! 🎉";
    btn.disabled = true;
  };

  /* keep the card's flip/drag physics from hijacking button presses */
  btn.addEventListener("pointerdown", (e) => e.stopPropagation());

  /* show the current count on load (404 just means nobody yet) */
  fetch(GET_URL)
    .then((r) => (r.ok ? r.json() : { value: 0 }))
    .then((d) => showCount(d.value ?? 0))
    .catch(() => { label.textContent = ""; });

  /* already said hi from this browser? */
  if (localStorage.getItem(STORAGE_KEY)) markSaid();

  btn.addEventListener("click", async () => {
    if (btn.disabled) return;
    markSaid();
    localStorage.setItem(STORAGE_KEY, "1");
    try {
      const res = await fetch(HIT_URL);
      const data = await res.json();
      showCount(data.value);
    } catch {
      /* offline / API down: the click still feels acknowledged */
    }
  });
})();
