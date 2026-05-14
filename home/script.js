/**
 * Pash Studios — Matter.js & GSAP Implementation
 * Built from scratch with 72px font size.
 * Elements start at viewport top and fall to bottom.
 */

(function () {
    const {
        Engine, Render, Runner, Bodies, Composite,
        Mouse, MouseConstraint, Events, Query
    } = Matter;

    const heroEl = document.getElementById('hero') || document.body;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const FONT_SIZE = 200;
    const START_Y = -100; // Change this (e.g., H/2) to set the initial height

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Initial setup: Wait for all assets (images and fonts) to be fully loaded
    window.addEventListener('load', () => {
        document.fonts.ready.then(() => {
            setupPhysics();
        });
    });

    function setupPhysics() {
        // ── 1. Create Engine & World ─────────────────────────────────────
        const engine = Engine.create({
            gravity: { x: 0, y: 1.2 },
            enableSleeping: true // Stop calculating at rest
        });
        const world = engine.world;

        // ── 2. Create Canvas for interaction ─────────────────────────────
        const canvas = document.getElementById('physics-canvas');
        canvas.width = W;
        canvas.height = H;

        const render = Render.create({
            canvas,
            engine,
            options: {
                width: W,
                height: H,
                wireframes: false,
                background: 'transparent',
                pixelRatio: 1 // Force 1:1 with CSS pixels to fix offset anchors
            }
        });

        // ── 3. Walls ─────────────────────────────────────────────────────
        const WALL_THICKNESS = 500;
        const ground = Bodies.rectangle(W / 2, H + WALL_THICKNESS / 2, W * 3, WALL_THICKNESS, { isStatic: true });
        const leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, H / 2, WALL_THICKNESS, H * 3, { isStatic: true });
        const rightWall = Bodies.rectangle(W + WALL_THICKNESS / 2, H / 2, WALL_THICKNESS, H * 3, { isStatic: true });

        Composite.add(world, [ground, leftWall, rightWall]);

        // ── 4. Letters ───────────────────────────────────────────────────
        const letterEls = Array.from(document.querySelectorAll('.letter-body'));
        const physBodies = [];

        // Pashmina (8 letters), Shawls (6 letters) - now responsive using clamp
        const PASHMINA_SIZE = 'clamp(100px, 15vw, 350px)';
        const SHAWLS_SIZE = 'clamp(40px, 12vw, 250px)';

        const pashminaEls = letterEls.slice(0, 8);
        const shawlsEls = letterEls.slice(8);

        function processRow(elements, fontSize, rowYOffset) {
            let rowWidth = 0;
            const data = elements.map(el => {
                el.style.fontSize = fontSize;
                el.style.position = 'absolute';
                el.style.lineHeight = '1';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.pointerEvents = 'none';
                const rect = el.getBoundingClientRect();
                rowWidth += rect.width * 0.8;
                return { el, bw: rect.width, bh: rect.height };
            });

            let startX = (W - rowWidth) / 2;
            data.forEach((item, i) => {
                const cx = startX + (item.bw / 2);
                const spawnY = START_Y + rowYOffset + (i * 20); // Add slight stagger within row

                const body = Bodies.rectangle(cx, spawnY, item.bw * 0.8, item.bh * 0.8, {
                    restitution: 0.3,
                    friction: 0.5,
                    frictionAir: 0.02,
                    density: 0.005,
                    angle: (Math.random() - 0.5) * 0.2,
                    chamfer: { radius: 6 },
                    label: fontSize === PASHMINA_SIZE ? 'pashmina' : 'shawls'
                });

                body._el = item.el;
                body._bw = item.bw;
                body._bh = item.bh;
                physBodies.push(body);
                startX += item.bw * 0.8;
            });
        }

        // Process Shawls (Top Row) first
        processRow(shawlsEls, SHAWLS_SIZE, 0);
        // Process Pashmina (Bottom Row) with a vertical offset based on screen size
        const pashOffset = window.innerWidth < 768 ? 120 : 350;
        processRow(pashminaEls, PASHMINA_SIZE, pashOffset);

        // ── 5. Stickers ──────────────────────────────────────────────────

        // ── 5. Stickers ──────────────────────────────────────────────────
        const stickerEls = Array.from(document.querySelectorAll('.sticker'));
        stickerEls.forEach((el) => {
            el.style.pointerEvents = 'none';
            const rect = el.getBoundingClientRect();
            const bw = rect.width;
            const bh = rect.height;

            // Start stickers where they are in layout but add them to physics
            const cx = rect.left + bw / 2;
            const cy = rect.top + bh / 2;

            const body = Bodies.rectangle(cx, cy, bw * 0.9, bh * 0.9, {
                restitution: 0.4,
                friction: 0.3,
                frictionAir: 0.015,
                density: 0.002,
                angle: (Math.random() - 0.5) * 0.1,
                chamfer: { radius: 10 },
                label: 'sticker'
            });

            el.style.bottom = 'auto';
            el.style.right = 'auto';
            el.style.margin = '0';

            body._el = el;
            body._bw = bw;
            body._bh = bh;
            physBodies.push(body);
        });

        Composite.add(world, physBodies);

        // ── 6. Mouse Interaction ─────────────────────────────────────────
        const mouse = Mouse.create(canvas);
        if (mouse.element) {
            mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
            mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
            mouse.element.removeEventListener("wheel", mouse.mousewheel);
        }

        const mc = MouseConstraint.create(engine, {
            mouse,
            constraint: { stiffness: 0.15, damping: 0.1, render: { visible: false } }
        });
        Composite.add(world, mc);
        render.mouse = mouse;

        // Interaction Cursors
        Events.on(mc, 'startdrag', () => { canvas.style.cursor = 'grabbing'; });
        Events.on(mc, 'enddrag', () => { canvas.style.cursor = 'default'; });
        Events.on(mc, 'mousemove', e => {
            const found = Query.point(physBodies, e.mouse.position);
            canvas.style.cursor = found.length ? 'grab' : 'default';
        });

        // ── 7. GSAP Sync Loop ────────────────────────────────────────────
        gsap.ticker.add((time, deltaTime) => {
            Engine.update(engine, deltaTime);

            physBodies.forEach(body => {
                // Optimization: Skip DOM updates if the body is sleeping (not moving)
                if (body.isSleeping) return;

                const el = body._el;
                if (!el) return;
                const { x, y } = body.position;
                el.style.left = (x - body._bw / 2) + 'px';
                el.style.top = (y - body._bh / 2) + 'px';
                el.style.transform = `rotate(${body.angle}rad)`;
            });
        });

        // Optional: Render wireframes to canvas (hidden by opacity 0 in CSS)
        Render.run(render);
    }

    // ─── Scroll Triggered Animations ──────────────────────────────────────────
    // Marquee movement tied to scroll
    gsap.to(".marquee-track", {
        x: "-25%", // Shifting left as we scroll
        ease: "none",
        scrollTrigger: {
            trigger: ".marquee-container",
            start: "top bottom", // Start when container enters viewport
            end: "bottom top",   // End when container leaves viewport
            scrub: 1             // Smoothly follow scroll
        }
    });

    // Resize: reload for layout accuracy
    window.addEventListener('resize', () => location.reload());

})();

// ─── Premium Text Reveal Animations (Impeccable) ──────────────────────────────
// Runs independently of physics — only needs DOM + GSAP + ScrollTrigger
(function initTextAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ── Utility: split an element's text into masked word spans ──────────────
    // Each word becomes: <span class="tw-mask"><span class="tw-inner">word</span></span>
    // Spaces are preserved as plain text nodes between the mask spans.
    function splitWords(el) {
        const raw = el.innerText.trim();
        el.innerHTML = raw.split(/\s+/).map(word =>
            `<span class="tw-mask"><span class="tw-inner">${word}</span></span>`
        ).join(' ');
        return Array.from(el.querySelectorAll('.tw-inner'));
    }

    // Impeccable's signature easing — expo deceleration, no bounce
    const E = 'expo.out';

    // ── 1. Himalaya paragraph — word-by-word, tight stagger ─────────────────
    const himalayaH4 = document.querySelector('.himalaya h4');
    if (himalayaH4) {
        const words = splitWords(himalayaH4);
        gsap.from(words, {
            yPercent: 110,
            opacity: 0,
            duration: 1.1,
            ease: E,
            stagger: 0.016,
            scrollTrigger: {
                trigger: himalayaH4,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // ── 2. "explore the craft" button — delayed fade-up ──────────────────────
    const btn = document.querySelector('.himalaya .btn');
    if (btn) {
        gsap.from(btn, {
            yPercent: 60,
            opacity: 0,
            duration: 1.0,
            ease: E,
            scrollTrigger: {
                trigger: btn,
                start: 'top 90%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // ── 3. "What is Pashmina?" headline — dramatic right-to-left stagger ─────
    // from:'end' means the last word reveals first, pulling the reader's eye
    // from the right edge inward — perfectly matching the right-alignment
    const headlineH2 = document.querySelector('.pashminawrap h2');
    if (headlineH2) {
        const words = splitWords(headlineH2);
        gsap.from(words, {
            yPercent: 110,
            duration: 1.6,
            ease: E,
            stagger: { each: 0.10, from: 'end' },
            scrollTrigger: {
                trigger: headlineH2,
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // ── 4. Second content paragraphs — staggered, offset by column ───────────
    Array.from(document.querySelectorAll('.secondcont h4')).forEach((el, i) => {
        const words = splitWords(el);
        gsap.from(words, {
            yPercent: 110,
            opacity: 0,
            duration: 1.0,
            ease: E,
            stagger: 0.013,
            delay: i * 0.18,          // right column starts slightly later
            scrollTrigger: {
                trigger: el,
                start: 'top 82%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // ── 5. Image row — cinematic scale-up reveal ─────────────────────────────
    const imageRowImg = document.querySelector('.image-row img');
    if (imageRowImg) {
        gsap.from(imageRowImg, {
            scale: 1.08,
            opacity: 0,
            duration: 1.8,
            ease: E,
            scrollTrigger: {
                trigger: '.image-row',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // ── 6. Third section image — slide in from the left ──────────────────────
    const thirdImg = document.querySelector('.third-section img');
    if (thirdImg) {
        gsap.from(thirdImg, {
            x: -120,
            opacity: 0,
            duration: 1.8,
            ease: E,
            scrollTrigger: {
                trigger: '.third-section',
                start: 'top 90%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // ── 7. Third section massive headline — SCRUBBED word reveal ─────────────
    // Words emerge one-by-one physically tied to the scroll position.
    // This turns the 140px right-aligned text into a "reading machine".
    const thirdH2 = document.querySelector('.third-section h2');
    if (thirdH2) {
        const words = splitWords(thirdH2);
        gsap.from(words, {
            yPercent: 110,
            opacity: 0,
            stagger: 0.06,
            scrollTrigger: {
                trigger: '.third-section',
                start: 'top 80%',
                end: 'bottom 30%',
                scrub: 1.5          // smooth scrub — words lock to your thumb/wheel
            }
        });
    }

})();
