import { useEffect } from "react";

/**
 * Lightweight scroll-reveal using a single IntersectionObserver.
 * Adds/removes a `.revealed` class so CSS handles the actual animation.
 *
 * Adds `.scroll-animations-ready` to root AFTER the browser has painted
 * and calculated full page height — prevents the "scroll twice" issue
 * where opacity:0 elements confuse the scroll height calculation.
 *
 * Replays every time an element scrolls back into view.
 */
export function useScrollAnimations(rootRef, isHome) {
  useEffect(() => {
    if (!isHome || !rootRef.current) return;

    const root = rootRef.current;

    // Wait for next frame so browser has full scroll height calculated,
    // THEN apply the animation-ready class that hides elements
    const raf = requestAnimationFrame(() => {
      root.classList.add("scroll-animations-ready");
    });

    const targets = root.querySelectorAll(
      ".agent-section__text, .agent-section__visual, .agent-section__badge, .agent-section__title, .agent-section__list li, footer"
    );

    if (!targets.length) {
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          } else {
            entry.target.classList.remove("revealed");
          }
        });
      },
      { threshold: 0.1 }
    );

    targets.forEach((el) => observer.observe(el));

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      root.classList.remove("scroll-animations-ready");
    };
  }, [isHome, rootRef]);
}
