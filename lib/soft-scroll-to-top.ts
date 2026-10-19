/** Ease matching `.page-enter` — cubic-bezier(0.22, 1, 0.36, 1) approx. */
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Gentle scroll to top — same soft feel as page enter transitions. */
export function softScrollToTop(durationMs = 420) {
  const start = window.scrollY || document.documentElement.scrollTop || 0;
  if (start < 2) {
    window.scrollTo(0, 0);
    return;
  }

  if (prefersReducedMotion()) {
    window.scrollTo(0, 0);
    return;
  }

  const startedAt = performance.now();

  function frame(now: number) {
    const t = Math.min(1, (now - startedAt) / durationMs);
    const y = Math.round(start * (1 - easeOutExpo(t)));
    window.scrollTo(0, y);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      window.scrollTo(0, 0);
    }
  }

  requestAnimationFrame(frame);
}

function documentScrollHeight() {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  );
}

/** Gentle scroll to the bottom of the page. */
export function softScrollToBottom(durationMs = 420) {
  const start = window.scrollY || document.documentElement.scrollTop || 0;
  const end = Math.max(
    0,
    documentScrollHeight() - window.innerHeight,
  );
  if (end - start < 2) {
    window.scrollTo(0, end);
    return;
  }

  if (prefersReducedMotion()) {
    window.scrollTo(0, end);
    return;
  }

  const distance = end - start;
  const startedAt = performance.now();

  function frame(now: number) {
    const t = Math.min(1, (now - startedAt) / durationMs);
    const y = Math.round(start + distance * easeOutExpo(t));
    window.scrollTo(0, y);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      window.scrollTo(0, end);
    }
  }

  requestAnimationFrame(frame);
}
