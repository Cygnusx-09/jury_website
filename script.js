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

        // Pashmina (8 letters) @ 300px, Shawls (6 letters) @ 200px
        const PASHMINA_SIZE = 300;
        const SHAWLS_SIZE = 200;

        const pashminaEls = letterEls.slice(0, 8);
        const shawlsEls = letterEls.slice(8);

        function processRow(elements, fontSize, rowYOffset) {
            let rowWidth = 0;
            const data = elements.map(el => {
                el.style.fontSize = fontSize + 'px';
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
        // Process Pashmina (Bottom Row) with a vertical offset
        processRow(pashminaEls, PASHMINA_SIZE, 350);

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
