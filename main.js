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
  "ALEX",
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
  let dragging = false;
  let pivotX = 0;
  let pivotY = 0;
  let moved = 0;
  let rafId = null;

  const setAngle = (a) => {
    badgeWrap.style.transform = `rotate(${a}deg)`;
  };

  const stopIdleSway = () => badgeWrap.classList.add("held");
  const startIdleSway = () => {
    badgeWrap.classList.remove("held");
    badgeWrap.style.transform = "";
  };

  const springBack = () => {
    velocity += -0.06 * angle;
    velocity *= 0.92;
    angle += velocity;
    setAngle(angle);

    if (Math.abs(angle) > 0.3 || Math.abs(velocity) > 0.3) {
      rafId = requestAnimationFrame(springBack);
    } else {
      angle = 0;
      velocity = 0;
      startIdleSway();
    }
  };

  badge.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    badge.setPointerCapture(e.pointerId);
    dragging = true;
    moved = 0;

    if (rafId) cancelAnimationFrame(rafId);
    stopIdleSway();

    const rect = badgeWrap.getBoundingClientRect();
    pivotX = rect.left + rect.width / 2;
    pivotY = rect.top;
    setAngle(angle);
  });

  badge.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moved += Math.abs(e.movementX) + Math.abs(e.movementY);

    const dx = e.clientX - pivotX;
    const dy = Math.max(e.clientY - pivotY, 40);
    const prev = angle;
    /* the crucial minus sign — see DIRECTION NOTE above */
    angle = -Math.max(-70, Math.min(70, (Math.atan2(dx, dy) * 180) / Math.PI));
    velocity = angle - prev;
    setAngle(angle);
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
   A fixed full-screen canvas sits behind the content (z-index -1).
   We listen on the whole document, but only start a stroke when the
   press lands on "empty" space — not on links, buttons, the card,
   the nav, or project cards — so all normal interactions still work.
*/
const canvas = document.getElementById("drawCanvas");

if (canvas) {
  const ctx = canvas.getContext("2d");
  let drawing = false;

  const resize = () => {
    /* copy existing drawing so a resize doesn't wipe it */
    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext("2d").drawImage(canvas, 0, 0);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.drawImage(snapshot, 0, 0);

    ctx.strokeStyle = "#ff6a5c";   /* coral pen */
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };
  resize();
  window.addEventListener("resize", resize);

  const isInteractive = (target) =>
    target.closest("a, button, input, textarea, .badge, .nav, .draw-ui, .chip");

  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;            // left click / touch only
    if (isInteractive(e.target)) return;   // let real UI work normally
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
  });

  document.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
  });

  const stopDrawing = () => { drawing = false; };
  document.addEventListener("pointerup", stopDrawing);
  document.addEventListener("pointercancel", stopDrawing);

  const clearBtn = document.getElementById("clearDraw");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
}
