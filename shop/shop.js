/**
 * shop.js — Pash Studios Shop Page
 *
 * Mirrors the Paper "ImageDithering" shader with EXACT settings
 * from the Lucky Sand design file:
 *
 *   Type          : 8x8 (Bayer ordered dithering)
 *   Fit           : Cover
 *   Original colors: On   → dark areas → colorBack; bright areas → original img colour + tint
 *   Inverted      : Off
 *   Scale         : 1     (each dither cell = 1 pixel)
 *   Dither size   : 1
 *   Color steps   : 2     (3 visible tonal bands)
 *   colorBack     : #00000000  (transparent → #000C38 bg shows through)
 *   colorFront    : #94FFAF / 100%
 *   colorHighlight: #EAFF94 / 100%
 *
 * Hover → canvas fades to opacity 0 → original photo revealed beneath.
 */

(function () {
    'use strict';

    /* ─── 8×8 Bayer ordered-dither matrix ───────────────────────────────── */
    const BAYER = [
        0, 32, 8, 40, 2, 34, 10, 42,
        48, 16, 56, 24, 50, 18, 58, 26,
        12, 44, 4, 36, 14, 46, 6, 38,
        60, 28, 52, 20, 62, 30, 54, 22,
        3, 35, 11, 43, 1, 33, 9, 41,
        51, 19, 59, 27, 49, 17, 57, 25,
        15, 47, 7, 39, 13, 45, 5, 37,
        63, 31, 55, 23, 61, 29, 53, 21,
    ];

    /* ─── Palette (from Paper shader panel) ─────────────────────────────── */
    // colorBack = #00000000 (transparent) → CSS background #000C38 shows through
    const C_BACK = [0, 12, 56];  // #000C38 – what the eye sees for dark pixels
    const C_FRONT = [148, 255, 175];  // #94FFAF – mid-tone tint
    const C_HIGH = [234, 255, 148];  // #EAFF94 – highlight tint

    /* ─── originalColors: On ─────────────────────────────────────────────
     * Dark-dither band  → colorBack  (#000C38)
     * Mid-dither band   → original image pixel, lightly tinted by C_FRONT
     * Bright-dither band → original image pixel, lightly tinted by C_HIGH
     *
     * TINT_STRENGTH controls how much the foreground palette bleeds into
     * the original colours. 0 = pure original, 1 = full palette replacement.
     * ─────────────────────────────────────────────────────────────────── */
    const TINT_STRENGTH = 0.30;  // 30% palette tint, 70% original — matches "On"

    /* ─── Dithering kernel ────────────────────────────────────────────── */
    function ditherImageData(imgData, W, H) {
        const src = imgData.data;
        const out = new Uint8ClampedArray(src.length);
        const COLOR_STEPS = 2;  // from Paper panel

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const i = (y * W + x) * 4;

                const sr = src[i] / 255;
                const sg = src[i + 1] / 255;
                const sb = src[i + 2] / 255;

                // Perceived luminance (BT.601)
                const lum = 0.299 * sr + 0.587 * sg + 0.114 * sb;

                // Normalised Bayer threshold [0 … 1)  — dither size = 1 (1 px per cell)
                const t = BAYER[(y % 8) * 8 + (x % 8)] / 64;

                // Ordered dithering: quantise lum into COLOR_STEPS levels
                // inverted = false → no inversion
                const q = Math.floor((lum + t / COLOR_STEPS) * COLOR_STEPS) / COLOR_STEPS;

                let outR, outG, outB;

                if (q <= 0) {
                    /* ── Dark band → colorBack (navy #000C38) ── */
                    outR = C_BACK[0];
                    outG = C_BACK[1];
                    outB = C_BACK[2];
                } else if (q <= 0.5) {
                    /* ── Mid band → original colour + colorFront tint ── */
                    outR = Math.round(src[i] * (1 - TINT_STRENGTH) + C_FRONT[0] * TINT_STRENGTH);
                    outG = Math.round(src[i + 1] * (1 - TINT_STRENGTH) + C_FRONT[1] * TINT_STRENGTH);
                    outB = Math.round(src[i + 2] * (1 - TINT_STRENGTH) + C_FRONT[2] * TINT_STRENGTH);
                } else {
                    /* ── Bright band → original colour + colorHighlight tint ── */
                    outR = Math.round(src[i] * (1 - TINT_STRENGTH) + C_HIGH[0] * TINT_STRENGTH);
                    outG = Math.round(src[i + 1] * (1 - TINT_STRENGTH) + C_HIGH[1] * TINT_STRENGTH);
                    outB = Math.round(src[i + 2] * (1 - TINT_STRENGTH) + C_HIGH[2] * TINT_STRENGTH);
                }

                out[i] = outR;
                out[i + 1] = outG;
                out[i + 2] = outB;
                out[i + 3] = 255;
            }
        }
        return new ImageData(out, W, H);
    }

    /* ─── Build overlay canvas for a single .product-img-wrap ─────────── */
    function buildDitherOverlay(wrap) {
        const img = wrap.querySelector('.product-img');
        if (!img) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'product-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        wrap.appendChild(canvas);

        function render() {
            const W = wrap.clientWidth || 168;
            const H = wrap.clientHeight || 126;
            canvas.width = W;
            canvas.height = H;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            // Draw the image scaled to cover (fit: cover)
            const iw = img.naturalWidth || W;
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

        // Re-render on container resize
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(render);
            ro.observe(wrap);
        }
    }

    /* ─── Init ────────────────────────────────────────────────────────── */
    function init() {
        document.querySelectorAll('.product-img-wrap').forEach(buildDitherOverlay);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
