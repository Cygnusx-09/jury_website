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
