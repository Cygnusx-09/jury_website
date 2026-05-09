/**
 * Pash Studios — Explore Page Animations
 * Powered by GSAP & ScrollTrigger
 * 
 * Focus: High-end luxury, subtle reveals, and "Soft UI" aesthetics.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // ─── 1. Hero Section: Parallax & Staggered Reveal ───────────────────
    const title = document.querySelector('.ex-hero__title');
    if (title) {
        // Split text into letters for staggering
        const text = title.textContent;
        title.innerHTML = text.split('').map(char => `<span class="char">${char}</span>`).join('');
        
        gsap.from(".ex-hero__title .char", {
            y: 100,
            opacity: 0,
            duration: 1.2,
            stagger: 0.1,
            ease: "power4.out",
            delay: 0.2
        });
    }

    // Enhanced Hero Image-Wrap Scroll Animation
    gsap.to(".ex-hero__img-wrap", {
        scale: 1.1,
        y: 40,
        ease: "none",
        scrollTrigger: {
            trigger: ".ex-hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // Keep a subtle movement on the image itself for extra depth
    gsap.to(".ex-hero__img", {
        y: -30,
        ease: "none",
        scrollTrigger: {
            trigger: ".ex-hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });



    // ─── 2. Journey Section: Staggered Batch Entrance ─────────────────────
    const processCards = gsap.utils.toArray(".ex-process-card");

    // Set initial state
    gsap.set(processCards, { opacity: 0, y: 40 });

    ScrollTrigger.batch(processCards, {
        onEnter: batch => gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power2.out",
            overwrite: true
        }),
        start: "top 85%"
    });

    // ─── 3. Loom Section: Sequential Text Reveal ──────────────────────────
    const loomTexts = gsap.utils.toArray(".ex-loom__text");

    loomTexts.forEach((text) => {
        gsap.from(text, {
            opacity: 0,
            y: 30,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: text,
                start: "top 90%",
                toggleActions: "play none none none"
            }
        });
    });

    // ─── 4. Motifs Section: Slide-in Entrance ──────────────────────────────
    gsap.from(".ex-motifs__title", {
        opacity: 0,
        x: -30,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".ex-motifs",
            start: "top 85%",
            toggleActions: "play none none none"
        }
    });

    // Animate motif rows with slide-in from the left (excluding the name)
    const motifRows = gsap.utils.toArray(".ex-motif-row");
    motifRows.forEach((row) => {
        // Target only the content block (left, mid, or right)
        const contentBlock = row.querySelectorAll('.ex-motif-row__left, .ex-motif-row__mid, .ex-motif-row__right');
        
        if (contentBlock.length > 0) {
            gsap.from(contentBlock, {
                x: -150,
                opacity: 0,
                duration: 1.5,
                ease: "power3.out",
                stagger: 0.1,
                scrollTrigger: {
                    trigger: row,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            });
        }

        // Separate subtle fade for the name
        const name = row.querySelector('.ex-motif-row__name');
        if (name) {
            gsap.from(name, {
                opacity: 0,
                duration: 1.2,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: row,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            });
        }

        // Add a slight parallax to the images within the rows
        const img = row.querySelector('.ex-motif-row__img img');
        if (img) {
            gsap.to(img, {
                y: -20,
                ease: "none",
                scrollTrigger: {
                    trigger: row,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        }
    });

    // ─── 5. Closing Section: Subtle Zoom ──────────────────────────────────
    gsap.from(".ex-closing__img", {
        scale: 0.9,
        opacity: 0,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".ex-closing",
            start: "top 80%"
        }
    });
});
