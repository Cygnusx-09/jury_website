/**
 * DragElements — Vanilla JS implementation
 * Inspired by fancycomponents.dev/docs/components/blocks/drag-elements
 *
 * Polaroid-style photo cards randomly scattered across the container,
 * each individually draggable with momentum-free movement.
 * Uses local images from "svg path/" folder.
 */

(function () {

  const IMAGES = [
    "svg%20path/Bootis.png",
    "svg%20path/Boteh.png",
    "svg%20path/Chinar.png",
    "svg%20path/Dehairing.png",
    "svg%20path/Sorting.png",
    "svg%20path/Spinning.png",
    "svg%20path/Weaving.png",
    "svg%20path/Harvesting%20and%20Combing.png",
    "svg%20path/Herding.png",
    "svg%20path/Final%20Product.png",
  ];

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("drag-elements-section");
    if (!container) return;

    const padding = 60; // keep cards away from edges

    IMAGES.forEach((src, i) => {
      // Card dimensions — polaroid style
      const cardW = randomInt(140, 180);
      const cardH = randomInt(100, 140);
      const rotation = randomInt(-8, 8);

      // Random starting position within container (deferred to first layout)
      const card = document.createElement("div");
      card.className = "drag-card";
      card.style.cssText = `
        width: ${cardW}px;
        height: ${cardH}px;
        transform: rotate(${rotation}deg);
        position: absolute;
        box-shadow: 0 8px 30px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10);
        cursor: grab;
        user-select: none;
        will-change: transform;
        z-index: ${10 + i};
        overflow: hidden;
      `;

      const img = document.createElement("img");
      img.src = src;
      img.draggable = false;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;";

      card.appendChild(img);
      container.appendChild(card);

      // ── Drag Logic (no momentum) ────────────────────────────────────────
      let startX = 0, startY = 0;
      let origLeft = 0, origTop = 0;
      let isDragging = false;
      let posX = 0, posY = 0;

      // Set initial random position once layout is known
      const setInitialPosition = () => {
        const cw = container.offsetWidth;
        const ch = container.offsetHeight;
        posX = randomInt(padding, cw - cardW - padding);
        posY = randomInt(padding, ch - cardH - padding);
        card.style.left = posX + "px";
        card.style.top  = posY + "px";
        card.style.transform = `rotate(${rotation}deg)`;
      };

      // Use requestAnimationFrame to wait for container dimensions
      requestAnimationFrame(setInitialPosition);

      card.addEventListener("mousedown", e => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        origLeft = posX;
        origTop  = posY;
        card.style.cursor = "grabbing";
        card.style.zIndex = 999;
        card.style.transition = "none";
        
        // For click detection
        card.dataset.dragged = "false";
        e.preventDefault();
      });

      window.addEventListener("mousemove", e => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        // If moved more than 5px, mark as dragged
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          card.dataset.dragged = "true";
        }

        const cw = container.offsetWidth;
        const ch = container.offsetHeight;

        posX = clamp(origLeft + dx, 0, cw - cardW);
        posY = clamp(origTop  + dy, 0, ch - cardH);

        card.style.left = posX + "px";
        card.style.top  = posY + "px";
        
        // Keep scale consistent with expanded state if active
        const isExpanded = card.classList.contains('expanded');
        const baseScale = isExpanded ? 2.5 : 1;
        card.style.transform = `rotate(${rotation}deg) scale(${baseScale * 1.04})`;
      });

      window.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        card.style.cursor = "grab";
        card.style.zIndex = 10 + i;
        
        const isExpanded = card.classList.contains('expanded');
        
        // Handle click if not dragged
        if (card.dataset.dragged === "false") {
          card.classList.toggle('expanded');
          const newExpanded = card.classList.contains('expanded');
          card.style.zIndex = newExpanded ? 1000 : 10 + i;
          card.style.transform = `rotate(${rotation}deg) scale(${newExpanded ? 2.5 : 1})`;
        } else {
          card.style.transform = `rotate(${rotation}deg) scale(${isExpanded ? 2.5 : 1})`;
        }
        
        card.style.transition = "box-shadow 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
      });

      // Touch support (simplified for brevity, focusing on click/tap)
      card.addEventListener("touchstart", e => {
        const touch = e.touches[0];
        isDragging = true;
        startX = touch.clientX;
        startY = touch.clientY;
        origLeft = posX;
        origTop  = posY;
        card.style.zIndex = 999;
        card.dataset.dragged = "false";
      }, { passive: true });

      window.addEventListener("touchmove", e => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          card.dataset.dragged = "true";
        }
        const cw = container.offsetWidth;
        const ch = container.offsetHeight;
        posX = clamp(origLeft + dx, 0, cw - cardW);
        posY = clamp(origTop  + dy, 0, ch - cardH);
        card.style.left = posX + "px";
        card.style.top  = posY + "px";
      }, { passive: true });

      window.addEventListener("touchend", () => {
        if (!isDragging) return;
        isDragging = false;
        
        if (card.dataset.dragged === "false") {
          card.classList.toggle('expanded');
          const isExpanded = card.classList.contains('expanded');
          card.style.zIndex = isExpanded ? 1000 : 10 + i;
          card.style.transform = `rotate(${rotation}deg) scale(${isExpanded ? 2.5 : 1})`;
        } else {
          const isExpanded = card.classList.contains('expanded');
          card.style.transform = `rotate(${rotation}deg) scale(${isExpanded ? 2.5 : 1})`;
        }
        card.style.zIndex = card.classList.contains('expanded') ? 1000 : 10 + i;
      });

      // Hover lift effect
      card.addEventListener("mouseenter", () => {
        if (!isDragging) {
          const isExpanded = card.classList.contains('expanded');
          card.style.transition = "box-shadow 0.2s ease, transform 0.3s ease";
          card.style.boxShadow = "0 20px 50px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.12)";
          card.style.transform = `rotate(${rotation}deg) scale(${isExpanded ? 2.6 : 1.06})`;
          card.style.zIndex = isExpanded ? 1001 : 10 + i;
        }
      });
      card.addEventListener("mouseleave", () => {
        if (!isDragging) {
          const isExpanded = card.classList.contains('expanded');
          card.style.boxShadow = "0 8px 30px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)";
          card.style.transform = `rotate(${rotation}deg) scale(${isExpanded ? 2.5 : 1})`;
          card.style.zIndex = isExpanded ? 1000 : 10 + i;
        }
      });
    });

    // ── Calendar Logic ──────────────────────────────────────────────────
    const calendarGrid = document.getElementById("calendar-grid");
    const monthYearLabel = document.getElementById("calendar-month-year");
    if (calendarGrid && monthYearLabel) {
      const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const now = new Date();
      const today = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let selectedDay = null; // track the currently selected day element

      monthYearLabel.innerText = `${now.toLocaleString("default", { month: "long" })}, ${currentYear}`;

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      // Header row
      DAY_NAMES.forEach(name => {
        const div = document.createElement("div");
        div.className = "calendar-day header";
        div.innerText = name;
        calendarGrid.appendChild(div);
      });

      // Empty leading slots
      for (let i = 0; i < firstDay; i++) {
        const div = document.createElement("div");
        div.className = "calendar-day empty";
        calendarGrid.appendChild(div);
      }

      // Day cells
      for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement("div");
        div.className = "calendar-day selectable";
        div.innerText = i;

        if (i < today) {
          // Past date — greyed out, not clickable
          div.classList.add("past");
        } else if (i === today) {
          // Today — mark with a dot
          div.classList.add("today");
          div.addEventListener("click", () => handleSelect(div));
        } else {
          // Future date — fully clickable
          div.addEventListener("click", () => handleSelect(div));
        }

        calendarGrid.appendChild(div);
      }

      function handleSelect(div) {
        if (selectedDay && selectedDay !== div) {
          selectedDay.classList.remove("active");
        }
        div.classList.toggle("active");
        selectedDay = div.classList.contains("active") ? div : null;

        // Update the duration label with selected date
        if (selectedDay) {
          const day = selectedDay.innerText;
          const month = now.toLocaleString("default", { month: "long" });
          monthYearLabel.innerHTML = `${month}, ${currentYear} <span style="color:#FF9345;">— ${day}th selected</span>`;
        } else {
          monthYearLabel.innerText = `${now.toLocaleString("default", { month: "long" })}, ${currentYear}`;
        }
      }
    }
  });

})();
