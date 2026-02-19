import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import * as THREE from "three";

export default function CyberScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 140;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    const pointCount = 1600;
    const positions = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i += 1) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 260;
      positions[i3 + 1] = (Math.random() - 0.5) * 220;
      positions[i3 + 2] = (Math.random() - 0.5) * 120;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x3ef8c1,
      size: 1.05,
      transparent: true,
      opacity: 0.78,
    });

    const points = new THREE.Points(geo, pointsMaterial);
    scene.add(points);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(40, 36, 36),
      new THREE.MeshBasicMaterial({
        color: 0x3ef8c1,
        transparent: true,
        wireframe: true,
        opacity: 0.18,
      })
    );
    scene.add(earth);

    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(52, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00b7ff,
        transparent: true,
        wireframe: true,
        opacity: 0.12,
      })
    );
    scene.add(aura);

    const rotationTimeline = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });
    rotationTimeline
      .to(points.rotation, { y: Math.PI * 2, duration: 44 }, 0)
      .to(aura.rotation, { y: -Math.PI * 2, duration: 38 }, 0)
      .to(earth.rotation, { y: Math.PI * 2, duration: 52 }, 0);

    const auraPulse = gsap.to(aura.scale, {
      x: 1.12,
      y: 1.12,
      z: 1.12,
      duration: 2.8,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    let rafId = 0;
    const render = () => {
      points.rotation.x += 0.00075;
      earth.rotation.x += 0.00035;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };
    render();

    const onResize = () => {
      const nextWidth = mount.clientWidth || width;
      const nextHeight = mount.clientHeight || height;
      renderer.setSize(nextWidth, nextHeight);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
      rotationTimeline.kill();
      auraPulse.kill();
      aura.geometry.dispose();
      aura.material.dispose();
      earth.geometry.dispose();
      earth.material.dispose();
      points.material.dispose();
      geo.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="network-canvas" aria-hidden="true" />;
}
