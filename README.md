# Aaron — Computer Engineering Portfolio

Personal portfolio of **Aaron Wong** — Computer Engineering student at
**Georgia Tech** (B.S., expected May 2027), focused on **hardware–software
integration**: digital design and custom PCBs on one side, embedded AI,
cloud services, and thoughtful interfaces on the other.

**Live site:** https://abulala1.github.io/mywebsite/

---

## 👋 About

- 🎓 **Georgia Institute of Technology** — B.S. Computer Engineering (expected May 2027);
  previously A.S. Engineering, San Antonio College
- 🔬 **Student Research Assistant** — building a custom **NMR spectrometer** from the
  ground up: Verilog pulse sequences on an FPGA, an RF-shielded analog front-end,
  and a fully custom PCB *(ongoing)*
- 💼 **Software Engineer Intern @ Yakin ICT Technology** — fault-tolerant data
  pipelines migrating legacy systems to AWS; Docker-based deployment
- 🏅 **Research Computing Fellow, Google exploreCSR** — Edge AI and real-time
  graphics on the NVIDIA Jetson Nano
- 🏆 **Hackathon wins:** *Best Use of Snowflake* (WanderLore, QuackHack 3.0);
  *Best Use of Gemini API + Best Use of Vultr* (VibeCheck, DesignVerse 2026)

## 🛠 Core skills

| Area | Highlights |
| --- | --- |
| Languages | C/C++, Python, Java, Verilog & VHDL, RISC-V Assembly, MATLAB, SQL, JS |
| Hardware | Custom PCB design, schematic capture, analog/digital/mixed-signal, RF & shielding |
| Lab equipment | Oscilloscopes, spectrum analyzers, signal generators, DAQ systems |
| MCUs & FPGAs | DE0-Nano / DE10, ESP32 (S3/C6), ARM mbed, Raspberry Pi, Arduino, Jetson Nano |
| Embedded | FreeRTOS (mutexes/semaphores/ISRs), MMIO, SPI · I2C · UART · TCP/IP · BLE, Edge AI |
| Cloud, AI & Web | AWS, Vultr, Docker, Gemini API, Snowflake Cortex, React/Next.js, Three.js |
| CAD & tools | SolidWorks, AutoCAD, Quartus II, SPICE, 3D printing, Git |

## 📁 Featured projects

| Project | What it is | Link |
| --- | --- | --- |
| **Custom NMR Spectrometer** | Ground-up NMR instrument: FPGA pulse-sequence RTL, RF-shielded front-end, custom PCB | *ongoing research* |
| **SCOMP Arithmetic Accelerator** | Hardware 16-bit multiply/divide peripheral in pure combinational VHDL | coursework |
| **Embedded Edge AI System** | Multi-threaded FreeRTOS app on ESP32-S3: on-device inference, BLE, thread-safe pipelines | personal build |
| **Crazy Dave** 🌱 | AI bio-acoustic garden defense on a repurposed Google Home Mini | [Devpost](https://devpost.com/software/crazy-dave) |
| **WanderLore** 🏆 | Event-driven LLM orchestration via Snowflake Cortex — QuackHack 3.0 winner | [GitHub](https://github.com/Abulala1/wanderlor) |
| **VibeCheck** 🏆 | Full-stack 3D interior design app: React + Three.js + Gemini — DesignVerse winner | [GitHub](https://github.com/Abulala1/vibecheck-hackathon) |

---

## ✨ About this site

Built with **plain HTML, CSS, and vanilla JavaScript** — no frameworks, no
build step — and hosted free on **GitHub Pages**. Things worth poking at:

- **Interactive lanyard ID card** — drag it (pendulum-spring physics in rotation
  *and* vertical stretch), click to flip for info; keyboard-accessible
- **A character whose eyes follow your cursor**
- **Sketch layer** — draw anywhere on the background; strokes cycle colors, and a
  single click bursts into a paint-splatter particle explosion
- **Dev-board skill game** — drag skill "ICs" into sockets on a custom dev board;
  the LCD computes a job title from the combination you build
- Typewriter intro, hand-drawn "boiling" letters, scroll-reveal, and
  `prefers-reduced-motion` support throughout

**Techniques:** Pointer Events drag & drop, Canvas 2D with a two-layer draw
buffer + particle system, spring physics via `requestAnimationFrame`,
IntersectionObserver, CSS 3D transforms and `steps()` frame animation.

## 🔧 Maintaining the site

The site is deliberately easy to update:

- **Words & content** → edit the HTML files directly; sections are labeled
  with comments
- **Typewriter roles, pen colors, skill ICs, and LCD titles** → all live in the
  `CONFIG` object at the top of `main.js` — plain data, no code changes needed
- **Colors & theme** → the CSS variables in `:root` at the top of `style.css`
  recolor everything at once
- **Run locally** → open the folder in VS Code, install the *Live Server*
  extension, right-click `index.html` → *Open with Live Server*

## 📫 Contact

- Email: [aaronyewsingwong@gmail.com](mailto:aaronyewsingwong@gmail.com)
- LinkedIn: [linkedin.com/in/aaron-w-1886972a1](https://www.linkedin.com/in/aaron-w-1886972a1/)
- GitHub: [github.com/Abulala1](https://github.com/Abulala1)
