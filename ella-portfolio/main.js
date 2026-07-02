/* ============================================================
   main.js — shared behavior for all pages
   1) Hamburger menu (mobile)
   2) Draggable hero chips (like the reference site)
   3) Scroll-reveal animation
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

/* ---------- 2) Draggable chips ---------- */
/* Pointer Events work for both mouse and touch.
   Each chip can be picked up and dropped anywhere on screen. */
document.querySelectorAll(".chip").forEach((chip) => {
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;

  chip.addEventListener("pointerdown", (e) => {
    chip.setPointerCapture(e.pointerId);
    chip.classList.add("dragging");
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
  });

  chip.addEventListener("pointermove", (e) => {
    if (!chip.classList.contains("dragging")) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    chip.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  });

  chip.addEventListener("pointerup", (e) => {
    chip.releasePointerCapture(e.pointerId);
    chip.classList.remove("dragging");
  });
});

/* ---------- 3) Scroll reveal ---------- */
/* IntersectionObserver adds .visible when an element enters
   the viewport; CSS handles the fade/slide animation. */
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
