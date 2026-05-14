document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("transition-overlay");
    if (!overlay) return;

    // Select all direct children of body that are visible content
    const pageElements = Array.from(document.body.children).filter(el => {
        const tag = el.tagName.toLowerCase();
        return tag !== 'script' && tag !== 'style' && tag !== 'link' && el.id !== 'transition-overlay';
    });

    // 1. Reveal page on load
    // Overlay slides UP (-100%) out of view
    gsap.to(overlay, {
        yPercent: -100,
        duration: 0.9,
        ease: "power4.inOut",
        onComplete: () => {
            gsap.set(overlay, { yPercent: 100 }); // Prepare for next exit (to come from bottom)
        }
    });

    // Page contents slide UP from below (y: 60) and fade in
    gsap.from(pageElements, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.05
    });

    // 2. Intercept link clicks
    const links = document.querySelectorAll("a");
    links.forEach(link => {
        link.addEventListener("click", e => {
            const href = link.getAttribute("href");

            // Ignore external links, hash links, or target="_blank"
            if (!href ||
                href.startsWith("http") ||
                href.startsWith("#") ||
                link.getAttribute("target") === "_blank" ||
                href === "javascript:void(0)") {
                return;
            }

            e.preventDefault();

            document.body.classList.add("is-transitioning");

            // Page contents slide UP out of view (y: -60) and fade out
            gsap.to(pageElements, {
                y: -60,
                opacity: 0,
                duration: 0.7,
                ease: "power3.inOut",
                stagger: 0.02
            });

            // Overlay slides UP from below (yPercent: 100 -> 0)
            gsap.fromTo(overlay,
                { yPercent: 100 },
                {
                    yPercent: 0,
                    duration: 0.8,
                    ease: "power4.inOut",
                    onComplete: () => {
                        window.location.href = href;
                    }
                }
            );
        });
    });
});
