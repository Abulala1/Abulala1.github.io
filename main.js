/* ============================================================
   main.js — shared behavior
   1) Hamburger menu (all pages)
   2) Scroll-reveal (all pages)
   3) Typewriter roles (home)
   4) Lanyard ID card: drag → pendulum spring-back, click → flip
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
/* Types each role letter by letter, pauses, erases, moves on. */
const typed = document.getElementById("typed");
const roles = [
  "ELLA",
  "a Data Scientist",
  "an AI Reliability Nerd",
  "a Builder 🛠",
  "双语的 · Bilingual",
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
        setTimeout(tick, 1600); // pause on the full word
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

  // Respect users who prefer reduced motion: show a static word instead.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typed.textContent = roles[0];
  } else {
    tick();
  }
}

/* ---------- 4) Lanyard ID card physics ---------- */
/*
   The whole badge assembly (.badge-wrap) pivots at its TOP —
   like a real lanyard pinned at the clip.

   Drag  → the card rotates to follow your pointer (a pendulum).
   Release → a spring simulation swings it back and forth until
             it settles, then the gentle idle sway resumes.
   Click (a press that barely moves) → flip the card over.
*/
const badgeWrap = document.getElementById("badgeWrap");
const badge = document.getElementById("badge");

if (badgeWrap && badge) {
  let angle = 0;          // current rotation, degrees
  let velocity = 0;       // angular velocity for the spring
  let dragging = false;
  let pivotX = 0;
  let pivotY = 0;
  let downX = 0;
  let downY = 0;
  let moved = 0;          // total pointer travel, to tell click vs drag
  let rafId = null;

  const setAngle = (a) => {
    badgeWrap.style.transform = `rotate(${a}deg)`;
  };

  const stopIdleSway = () => badgeWrap.classList.add("held");
  const startIdleSway = () => {
    badgeWrap.classList.remove("held");
    badgeWrap.style.transform = "";
  };

  /* spring-back simulation: Hooke's law + damping, run per frame */
  const springBack = () => {
    velocity += -0.06 * angle;  // spring pulls toward 0
    velocity *= 0.92;           // damping (friction)
    angle += velocity;

    setAngle(angle);

    if (Math.abs(angle) > 0.3 || Math.abs(velocity) > 0.3) {
      rafId = requestAnimationFrame(springBack);
    } else {
      angle = 0;
      velocity = 0;
      startIdleSway();          // hand control back to the CSS sway
    }
  };

  badge.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    badge.setPointerCapture(e.pointerId);
    dragging = true;
    moved = 0;
    downX = e.clientX;
    downY = e.clientY;

    if (rafId) cancelAnimationFrame(rafId);
    stopIdleSway();

    /* pivot = top-center of the lanyard assembly */
    const rect = badgeWrap.getBoundingClientRect();
    pivotX = rect.left + rect.width / 2;
    pivotY = rect.top;
    setAngle(angle);
  });

  badge.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moved += Math.abs(e.movementX) + Math.abs(e.movementY);

    /* angle from the pivot to the pointer — the card "hangs"
       toward wherever you pull it */
    const dx = e.clientX - pivotX;
    const dy = Math.max(e.clientY - pivotY, 40); // avoid wild flips near pivot
    const prev = angle;
    angle = Math.max(-70, Math.min(70, (Math.atan2(dx, dy) * 180) / Math.PI));
    velocity = angle - prev; // remember momentum for a lively release
    setAngle(angle);
  });

  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    badge.releasePointerCapture?.(e.pointerId);

    /* tiny movement = a click → flip the card */
    if (moved < 8) {
      badge.classList.toggle("flipped");
    }

    rafId = requestAnimationFrame(springBack);
  };

  badge.addEventListener("pointerup", release);
  badge.addEventListener("pointercancel", release);

  /* keyboard access: Enter/Space flips the card too */
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
