import { useEffect } from "react";

export default function SmoothScroll({ children }) {
  useEffect(() => {
    let lenis = null;
    let frame = 0;
    let script = null;

    const start = () => {
      const LenisCtor = window.Lenis;
      if (!LenisCtor) {
        return;
      }

      lenis = new LenisCtor({
        duration: 1.1,
        smoothWheel: true,
        gestureOrientation: "vertical",
        wheelMultiplier: 0.9,
      });

      const raf = (time) => {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      };

      frame = requestAnimationFrame(raf);
    };

    if (window.Lenis) {
      start();
    } else {
      script = document.createElement("script");
      script.src = "https://unpkg.com/lenis@1.1.20/dist/lenis.min.js";
      script.async = true;
      script.onload = start;
      document.body.appendChild(script);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (lenis) {
        lenis.destroy();
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return children;
}
