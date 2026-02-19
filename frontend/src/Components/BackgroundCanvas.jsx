import { useEffect, useRef } from "react";

export default function BackgroundCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) {
      return undefined;
    }

    let renderer;
    let frameId;
    let cleanupFn = null;
    let script = null;

    const boot = () => {
      const THREE = window.THREE;
      if (!THREE || !mountNode) {
        return;
      }

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x050a14, 5, 26);

      const camera = new THREE.PerspectiveCamera(55, mountNode.clientWidth / mountNode.clientHeight, 0.1, 1000);
      camera.position.z = 8;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
      mountNode.appendChild(renderer.domElement);

      const particles = new THREE.BufferGeometry();
      const count = 1200;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 16;
        positions[i + 1] = (Math.random() - 0.5) * 12;
        positions[i + 2] = (Math.random() - 0.5) * 12;
      }
      particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0x7df9ff,
        size: 0.035,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.Points(particles, material);
      scene.add(mesh);

      const ringGeometry = new THREE.TorusGeometry(2.75, 0.01, 8, 200);
      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xff8c42, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2.25;
      scene.add(ring);

      const handleResize = () => {
        if (!mountNode) {
          return;
        }
        camera.aspect = mountNode.clientWidth / mountNode.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
      };

      const animate = () => {
        mesh.rotation.y += 0.00075;
        mesh.rotation.x += 0.00035;
        ring.rotation.z += 0.002;
        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(animate);
      };
      animate();

      window.addEventListener("resize", handleResize);

      cleanupFn = () => {
        window.removeEventListener("resize", handleResize);
        window.cancelAnimationFrame(frameId);
        particles.dispose();
        material.dispose();
        ringGeometry.dispose();
        ringMaterial.dispose();
        renderer.dispose();
      };
    };

    if (window.THREE) {
      boot();
    } else {
      script = document.createElement("script");
      script.src = "https://unpkg.com/three@0.174.0/build/three.min.js";
      script.async = true;
      script.onload = boot;
      document.body.appendChild(script);
    }

    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
      if (renderer && mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return <div ref={mountRef} className="background-canvas" aria-hidden="true" />;
}
