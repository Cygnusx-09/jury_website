/**
 * Pash Studios — Matter.js DOM Physics
 * Letters of "Pashmina" are DOM elements driven by Matter.js.
 * Font size fills 100vw. Letters settle at the bottom edge.
 * Stickers: pure CSS, no physics.
 */

(function () {
    const {
        Engine, Render, Runner, Bodies, Composite,
        Mouse, MouseConstraint, Events, Query
    } = Matter;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const LETTER_IDS = ['letter-P', 'letter-a', 'letter-s', 'letter-h', 'letter-m', 'letter-i', 'letter-n', 'letter-a2'];
    const LETTER_CHARS = ['P', 'a', 's', 'h', 'm', 'i', 'n', 'a'];

    // ─── Step 1: Wait for Erica One font to load, then compute layout ────────
    document.fonts.ready.then(init);

    function init() {

        // ── Measure font size so "Pashmina" fills 100% viewport width ─────
        const probe = document.createElement('div');
        probe.style.cssText =
            'position:fixed;top:-9999px;left:0;' +
            'font-family:"Erica One",serif;font-size:300px;' +
            'white-space:nowrap;visibility:hidden;pointer-events:none;line-height:1;';
        probe.textContent = 'Pashmina';
        document.body.appendChild(probe);

        const naturalWidth = probe.offsetWidth;
        const naturalHeight = probe.offsetHeight;
        // Scale so word = 100vw
        const fontSize = Math.floor(300 * (W / naturalWidth));

        document.body.removeChild(probe);

        // ── Set font-size and text on each letter div ─────────────────────
        LETTER_IDS.forEach((id, i) => {
            const el = document.getElementById(id);
            el.textContent = LETTER_CHARS[i];
            el.style.fontSize = fontSize + 'px';
            el.style.lineHeight = '1';
            // Park off-screen while we measure
            el.style.left = '-9999px';
            el.style.top = '-9999px';
            el.style.transform = 'none';
        });

        // ── Need one layout frame for measurements ────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => buildPhysics(fontSize, naturalHeight)));
    }

    function buildPhysics(fontSize, approxLetterHeight) {

        // ── Measure each letter's actual rendered size ────────────────────
        const letterEls = LETTER_IDS.map(id => document.getElementById(id));
        const widths = letterEls.map(el => el.getBoundingClientRect().width);
        const heights = letterEls.map(el => el.getBoundingClientRect().height);
        const letterH = heights[0]; // P reference height

        // ── Compute X centres so letters span viewport width exactly ──────
        const totalW = widths.reduce((s, w) => s + w, 0);
        const startX = Math.max(0, (W - totalW) / 2); // centre the word

        const centreXs = [];
        let cursor = startX;
        widths.forEach((w) => {
            centreXs.push(cursor + w / 2);
            cursor += w;
        });

        // ── Floor at viewport bottom so letters sit right at the edge ──────
        const floorY = H;

        // ── "Shawls" — just above the letter tops ────────────────────────
        const lettersTop = floorY - letterH;
        const shawlsEl = document.getElementById('shawls-text');
        const shawlsFS = Math.round(fontSize * 0.48);
        shawlsEl.style.fontSize = shawlsFS + 'px';
        shawlsEl.style.top = (lettersTop - shawlsFS - 8) + 'px';
        shawlsEl.style.left = Math.round(W * 0.33) + 'px';
        shawlsEl.style.transform = 'rotate(-8deg)';
        shawlsEl.style.visibility = 'visible';

        // ── Matter.js engine ──────────────────────────────────────────────
        const engine = Engine.create({ gravity: { x: 0, y: 1.2 } });
        const world = engine.world;

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
                pixelRatio: window.devicePixelRatio || 1
            }
        });

        // Walls
        const WALL = 80;
        Composite.add(world, [
            Bodies.rectangle(W / 2, floorY + WALL / 2, W * 3, WALL, { isStatic: true }),
            Bodies.rectangle(-WALL / 2, H / 2, WALL, H * 3, { isStatic: true }),
            Bodies.rectangle(W + WALL / 2, H / 2, WALL, H * 3, { isStatic: true }),
        ]);

        // ── Create letter physics bodies ──────────────────────────────────
        // Stagger spawn heights so they cascade nicely
        const spawnOffsets = [-60, -120, -80, -150, -100, -130, -90, -160];

        const physBodies = [];
        letterEls.forEach((el, i) => {
            const bw = widths[i];
            const bh = heights[i];
            const cx = centreXs[i];
            // Spawn above the floor
            const spawnY = lettersTop + spawnOffsets[i];

            const body = Bodies.rectangle(cx, spawnY, bw * 0.75, bh * 0.80, {
                restitution: 0.2,
                friction: 0.55,
                frictionAir: 0.025,
                density: 0.004,
                angle: (Math.random() - 0.5) * 0.15,
                chamfer: { radius: 6 },
                label: 'letter'
            });

            body._el = el;
            body._bw = bw;
            body._bh = bh;

            physBodies.push(body);
        });

        Composite.add(world, physBodies);

        // ── Mouse constraint ──────────────────────────────────────────────
        const mouse = Mouse.create(canvas);

        // Fix: Stop Matter.js from capturing scroll events
        if (mouse.element) {
            mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
            mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
        }

        const mc = MouseConstraint.create(engine, {
            mouse,
            constraint: { stiffness: 0.12, damping: 0.1, render: { visible: false } }
        });
        Composite.add(world, mc);
        render.mouse = mouse;

        Events.on(mc, 'startdrag', () => { canvas.style.cursor = 'grabbing'; });
        Events.on(mc, 'enddrag', () => { canvas.style.cursor = 'default'; });
        Events.on(mc, 'mousemove', e => {
            const found = Query.point(physBodies, e.mouse.position);
            canvas.style.cursor = found.length ? 'grab' : 'default';
        });

        // ── Sync DOM positions to physics bodies each frame ───────────────
        Events.on(engine, 'afterUpdate', () => {
            physBodies.forEach(body => {
                const el = body._el;
                if (!el) return;
                const { x, y } = body.position;
                el.style.left = (x - body._bw / 2) + 'px';
                el.style.top = (y - body._bh / 2) + 'px';
                el.style.transform = `rotate(${body.angle}rad)`;
            });
        });

        Render.run(render);
        Runner.run(Runner.create(), engine);
    }

    // ─── Resize: reload ───────────────────────────────────────────────────────
    window.addEventListener('resize', () => location.reload());

})();

// ── Scroll Triggered Marquee Animation ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const marqueeTrack = document.querySelector('.marquee-track');
    const section5 = document.querySelector('.section-image-5');
    
    if (marqueeTrack && section5) {
        const updateMarquee = () => {
            const scrollY = window.scrollY;
            const offset = scrollY * 0.4; // Speed multiplier
            
            // Apply the offset. We use a negative value to move left-to-right 
            // relative to the scroll direction.
            marqueeTrack.style.transform = `translateX(-${offset}px)`;
        };

        updateMarquee();
        window.addEventListener('scroll', updateMarquee);
        window.addEventListener('resize', updateMarquee);
    }
});
