"use strict";

// Change this single date to move the submission deadline.
const deadline = new Date("October 21, 2026 23:59:59 GMT+0530");

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");
const countdown = document.querySelector(".countdown");
const closedMessage = document.querySelector("#countdown-closed");
const timeFields = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};

// A restrained, cursor-reactive constellation mesh adds a little movement to the hero.
const hero = document.querySelector(".hero");
const meshCanvas = document.querySelector(".hero-mesh");
const meshContext = meshCanvas?.getContext("2d");

if (hero && meshCanvas && meshContext) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: -1000, y: -1000, previousX: -1000, previousY: -1000, speed: 0 };
  const lineColor = "37, 51, 45";
  const accentColor = "185, 79, 53";
  let nodes = [];
  let columns = 0;
  let rows = 0;
  let width = 0;
  let height = 0;
  let frameId = 0;
  let lastFrame = 0;
  let inView = true;
  let running = false;

  const resizeMesh = () => {
    const bounds = hero.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    meshCanvas.width = Math.round(width * pixelRatio);
    meshCanvas.height = Math.round(height * pixelRatio);
    meshContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const spacing = window.innerWidth <= 760 ? 62 : 78;
    columns = Math.ceil(width / spacing) + 1;
    rows = Math.ceil(height / spacing) + 1;
    nodes = [];

    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        const x = column * spacing;
        const y = row * spacing;
        nodes.push({
          x, y, baseX: x, baseY: y, vx: 0, vy: 0,
          radius: 1 + Math.random() * 1.1,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    if (reducedMotion.matches) drawMesh(0);
  };

  const updatePointer = (event) => {
    const bounds = hero.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;

    if (pointer.x < 0 || pointer.x > width || pointer.y < 0 || pointer.y > height) {
      pointer.x = -1000;
      pointer.y = -1000;
      return;
    }
  };

  const drawMesh = (elapsed) => {
    const dt = Math.min(elapsed, 0.04);
    const radius = 220;
    pointer.speed = Math.hypot(pointer.x - pointer.previousX, pointer.y - pointer.previousY) / (dt || 1);
    pointer.previousX = pointer.x;
    pointer.previousY = pointer.y;

    nodes.forEach((node) => {
      if (dt > 0) {
        node.pulse += dt * 2.2;
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const distance = Math.hypot(dx, dy);

        if (distance < radius && distance > 0) {
          const strength = (1 - distance / radius) * (260 + Math.min(pointer.speed, 1200) * 0.22);
          node.vx -= (dx / distance) * strength * dt;
          node.vy -= (dy / distance) * strength * dt;
        }

        node.vx += (node.baseX - node.x) * 15 * dt;
        node.vy += (node.baseY - node.y) * 15 * dt;
        node.vx *= Math.pow(0.84, dt * 60);
        node.vy *= Math.pow(0.84, dt * 60);
        node.x += node.vx * dt * 60;
        node.y += node.vy * dt * 60;
      }
    });

    meshContext.clearRect(0, 0, width, height);
    meshContext.lineWidth = 0.7;

    // Connect only nearby grid neighbours to keep the animation inexpensive.
    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        const node = nodes[column * rows + row];
        const neighbours = [];
        if (column + 1 < columns) neighbours.push(nodes[(column + 1) * rows + row]);
        if (row + 1 < rows) neighbours.push(nodes[column * rows + row + 1]);
        if (column + 1 < columns && row + 1 < rows) neighbours.push(nodes[(column + 1) * rows + row + 1]);
        if (column + 1 < columns && row > 0) neighbours.push(nodes[(column + 1) * rows + row - 1]);

        neighbours.forEach((neighbour) => {
          const distance = Math.hypot(node.x - neighbour.x, node.y - neighbour.y);
          const alpha = Math.max(0, 1 - distance / 120) * 0.16;
          if (alpha <= 0) return;
          const middleX = (node.x + neighbour.x) / 2;
          const middleY = (node.y + neighbour.y) / 2;
          const cursorProximity = Math.max(0, 1 - Math.hypot(pointer.x - middleX, pointer.y - middleY) / radius);
          const lineAlpha = Math.max(alpha, cursorProximity * 0.38);
          meshContext.strokeStyle = cursorProximity > 0.08
            ? `rgba(${accentColor}, ${lineAlpha})`
            : `rgba(${lineColor}, ${lineAlpha})`;
          meshContext.beginPath();
          meshContext.moveTo(node.x, node.y);
          meshContext.lineTo(neighbour.x, neighbour.y);
          meshContext.stroke();
        });
      }
    }

    nodes.forEach((node) => {
      const distance = Math.hypot(pointer.x - node.x, pointer.y - node.y);
      const active = distance < radius;
      meshContext.fillStyle = active
        ? `rgba(${accentColor}, ${0.92 * (1 - distance / radius)})`
        : `rgba(${lineColor}, ${0.2 + (Math.sin(node.pulse) + 1) * 0.055})`;
      meshContext.beginPath();
      meshContext.arc(node.x, node.y, active ? node.radius * 2.1 : node.radius, 0, Math.PI * 2);
      meshContext.fill();

      if (active && distance < 88) {
        const ringRadius = 4 + ((node.pulse * 12) % 21);
        meshContext.strokeStyle = `rgba(${accentColor}, ${0.18 * (1 - ringRadius / 30)})`;
        meshContext.beginPath();
        meshContext.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
        meshContext.stroke();
      }
    });

    if (pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height) {
      meshContext.strokeStyle = `rgba(${accentColor}, 0.44)`;
      meshContext.lineWidth = 1;
      meshContext.beginPath();
      meshContext.arc(pointer.x, pointer.y, 13, 0, Math.PI * 2);
      meshContext.stroke();
      meshContext.fillStyle = `rgba(${accentColor}, 0.72)`;
      meshContext.beginPath();
      meshContext.arc(pointer.x, pointer.y, 2, 0, Math.PI * 2);
      meshContext.fill();
    }
  };

  const animateMesh = (now) => {
    if (!running) return;
    const elapsed = lastFrame ? (now - lastFrame) / 1000 : 0;
    lastFrame = now;
    drawMesh(elapsed);
    frameId = window.requestAnimationFrame(animateMesh);
  };

  const startMesh = () => {
    if (running || !inView || document.hidden || reducedMotion.matches) return;
    running = true;
    lastFrame = 0;
    frameId = window.requestAnimationFrame(animateMesh);
  };

  const stopMesh = () => {
    running = false;
    window.cancelAnimationFrame(frameId);
  };

  resizeMesh();
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) startMesh();
      else stopMesh();
    }).observe(hero);
  }
  window.addEventListener("resize", resizeMesh, { passive: true });
  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) {
      pointer.x = -1000;
      pointer.y = -1000;
    }
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMesh();
    else startMesh();
  });
  reducedMotion.addEventListener("change", () => {
    stopMesh();
    if (reducedMotion.matches) drawMesh(0);
    else startMesh();
  });
  startMesh();
}

// Mobile navigation stays keyboard-operable and closes after choosing a section.
const closeMenu = () => {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  navigation.classList.remove("open");
  document.body.classList.remove("menu-open");
};

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
  navigation.classList.toggle("open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

// Live deadline countdown. The date above is the only value to edit.
const renderCountdown = () => {
  const remaining = deadline.getTime() - Date.now();
  if (remaining <= 0) {
    countdown.hidden = true;
    closedMessage.hidden = false;
    return;
  }

  const secondsRemaining = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(secondsRemaining / 86400),
    hours: Math.floor((secondsRemaining % 86400) / 3600),
    minutes: Math.floor((secondsRemaining % 3600) / 60),
    seconds: secondsRemaining % 60,
  };

  Object.entries(values).forEach(([unit, value]) => {
    timeFields[unit].textContent = String(value).padStart(2, "0");
  });
};

renderCountdown();
window.setInterval(renderCountdown, 1000);

// Native dialog provides a simple, focus-managed full-screen photo viewer.
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxClose = lightbox.querySelector(".lightbox-close");

document.querySelectorAll(".photo-tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    const image = tile.querySelector("img");
    lightboxImage.src = tile.dataset.full;
    lightboxImage.alt = image.alt;
    lightbox.showModal();
    lightboxClose.focus();
  });
});

lightboxClose.addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
