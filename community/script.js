document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Section Animation
    gsap.from(".hero-subtitle, .hero-title", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.2 // slight delay to allow any initial transition to finish
    });

    // Landscape Images Parallax
    gsap.to(".landscape-img.secondary", {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
            trigger: ".landscape-section",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });

    // Section Titles Fade In
    gsap.utils.toArray(".section-title, .what-we-do-title, .cta-title").forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 40,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // Artisan Portraits Stagger
    gsap.from(".portrait-img", {
        scrollTrigger: {
            trigger: ".artisan-portraits",
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
        ease: "power3.out"
    });

    // Artisan Roles Stagger
    gsap.from(".role-card", {
        scrollTrigger: {
            trigger: ".artisan-roles",
            start: "top 85%",
            toggleActions: "play none none reverse"
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
    });

    // Initiatives Stagger
    gsap.from(".initiative", {
        scrollTrigger: {
            trigger: ".initiatives-list",
            start: "top 85%",
            toggleActions: "play none none reverse"
        },
        x: -40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
    });

    // Bottom CTA elements fade in
    gsap.from(".cta-bottom > *", {
        scrollTrigger: {
            trigger: ".cta-bottom",
            start: "top 90%",
            toggleActions: "play none none reverse"
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
    });
});

/* ─── Image Dithering Shader (Matches Shop Section) ───────────────── */
(function () {
    'use strict';

    const BAYER = [
       0, 32,  8, 40,  2, 34, 10, 42,
      48, 16, 56, 24, 50, 18, 58, 26,
      12, 44,  4, 36, 14, 46,  6, 38,
      60, 28, 52, 20, 62, 30, 54, 22,
       3, 35, 11, 43,  1, 33,  9, 41,
      51, 19, 59, 27, 49, 17, 57, 25,
      15, 47,  7, 39, 13, 45,  5, 37,
      63, 31, 55, 23, 61, 29, 53, 21,
    ];

    const C_BACK      = [0,   12,  56 ];  // #000C38 
    const C_FRONT     = [148, 255, 175];  // #94FFAF
    const C_HIGH      = [234, 255, 148];  // #EAFF94
    const TINT_STRENGTH = 0.30; 

    function ditherImageData(imgData, W, H) {
      const src = imgData.data;
      const out = new Uint8ClampedArray(src.length);
      const COLOR_STEPS = 2;  

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;

          const sr = src[i    ] / 255;
          const sg = src[i + 1] / 255;
          const sb = src[i + 2] / 255;

          const lum = 0.299 * sr + 0.587 * sg + 0.114 * sb;
          const bx = Math.floor(x / 2) % 8;
          const by = Math.floor(y / 2) % 8;
          const t = BAYER[by * 8 + bx] / 64;
          const q = Math.floor((lum + t / COLOR_STEPS) * COLOR_STEPS) / COLOR_STEPS;

          let outR, outG, outB;

          if (q <= 0) {
            outR = C_BACK[0];
            outG = C_BACK[1];
            outB = C_BACK[2];
          } else if (q <= 0.5) {
            outR = Math.round(src[i    ] * (1 - TINT_STRENGTH) + C_FRONT[0] * TINT_STRENGTH);
            outG = Math.round(src[i + 1] * (1 - TINT_STRENGTH) + C_FRONT[1] * TINT_STRENGTH);
            outB = Math.round(src[i + 2] * (1 - TINT_STRENGTH) + C_FRONT[2] * TINT_STRENGTH);
          } else {
            outR = Math.round(src[i    ] * (1 - TINT_STRENGTH) + C_HIGH[0] * TINT_STRENGTH);
            outG = Math.round(src[i + 1] * (1 - TINT_STRENGTH) + C_HIGH[1] * TINT_STRENGTH);
            outB = Math.round(src[i + 2] * (1 - TINT_STRENGTH) + C_HIGH[2] * TINT_STRENGTH);
          }

          out[i    ] = outR;
          out[i + 1] = outG;
          out[i + 2] = outB;
          out[i + 3] = 255;
        }
      }
      return new ImageData(out, W, H);
    }

    function buildDitherOverlay(wrap) {
      const img = wrap.querySelector('.landscape-img');
      if (!img) return;

      const canvas = document.createElement('canvas');
      canvas.className = 'landscape-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      wrap.appendChild(canvas);

      function render() {
        const W = wrap.clientWidth;
        const H = wrap.clientHeight;
        if(W === 0 || H === 0) return; // Wait for layout
        canvas.width  = W;
        canvas.height = H;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const iw = img.naturalWidth  || W;
        const ih = img.naturalHeight || H;
        const scale = Math.max(W / iw, H / ih);
        const sw = iw * scale;
        const sh = ih * scale;
        ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);

        const raw = ctx.getImageData(0, 0, W, H);
        ctx.putImageData(ditherImageData(raw, W, H), 0, 0);
      }

      if (img.complete && img.naturalWidth > 0) {
        render();
      } else {
        img.addEventListener('load', render, { once: true });
      }

      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(render);
        ro.observe(wrap);
      }
    }

    function init() {
      document.querySelectorAll('.landscape-img-wrap').forEach(buildDitherOverlay);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
})();
