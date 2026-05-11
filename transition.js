document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("transition-overlay");
    if (!overlay) return;

    // 1. Reveal page on load
    gsap.to(overlay, {
        yPercent: -100,
        duration: 0.6,
        ease: "power4.inOut",
        onComplete: () => {
            gsap.set(overlay, { yPercent: 100 }); // Prepare for next exit
        }
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

            // Animate overlay back in
            gsap.fromTo(overlay,
                { yPercent: 100 },
                {
                    yPercent: 0,
                    duration: 0.6,
                    ease: "power4.inOut",
                    onComplete: () => {
                        window.location.href = href;
                    }
                }
            );
        });
    });
});
