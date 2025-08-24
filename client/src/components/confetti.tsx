import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeConfettiProps {
  durationMs?: number;
  onComplete?: () => void;
  className?: string;
}

// Lightweight Three.js confetti overlay suitable for celebratory bursts.
// Renders a full-screen WebGL canvas with falling, rotating confetti pieces.
export function ThreeConfetti({
  durationMs = 5000,
  onComplete,
  className = "fixed inset-0 pointer-events-none z-[9999]",
}: ThreeConfettiProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene and Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);

    // Confetti pieces
    // Use small planes with MeshPhongMaterial for shading highlights.
    const pieceCount = 250;
    const geometries = [
      new THREE.PlaneGeometry(0.22, 0.12),
      new THREE.PlaneGeometry(0.18, 0.18),
      new THREE.PlaneGeometry(0.28, 0.1),
    ];
    const colors = [
      0x8b5cf6, // purple
      0x3b82f6, // blue
      0x10b981, // emerald
      0xf59e0b, // amber
      0xef4444, // red
      0x22c55e, // green
      0x06b6d4, // cyan
      0xf97316, // orange
    ];

    const materials = colors.map(
      (c) =>
        new THREE.MeshPhongMaterial({
          color: c,
          side: THREE.DoubleSide,
          shininess: 80,
          specular: 0x444444,
          transparent: true,
        })
    );

    type Piece = {
      mesh: THREE.Mesh;
      vel: THREE.Vector3; // velocity
      rot: THREE.Vector3; // rotation speed
      life: number; // 0..1 fades near end
    };
    const pieces: Piece[] = [];

    const spawnPiece = (): Piece => {
      const geo = geometries[Math.floor(Math.random() * geometries.length)];
      const mat = materials[Math.floor(Math.random() * materials.length)].clone();
      const mesh = new THREE.Mesh(geo, mat);

      // Start near the top, with spread across width
      mesh.position.set((Math.random() - 0.5) * 28, height / 60 + Math.random() * 6, (Math.random() - 0.5) * 6);
      // Random rotation
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      // Velocity: mostly downward with some horizontal drift
      const vel = new THREE.Vector3((Math.random() - 0.5) * 0.6, -0.6 - Math.random() * 0.9, (Math.random() - 0.5) * 0.2);
      // Rotation speed
      const rot = new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2);

      scene.add(mesh);
      return { mesh, vel, rot, life: 1 };
    };

    for (let i = 0; i < pieceCount; i++) {
      pieces.push(spawnPiece());
    }

    const clock = new THREE.Clock();
    let elapsedTotal = 0;
    const gravity = new THREE.Vector3(0, -0.6, 0);

    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.033); // cap delta for stability
      elapsedTotal += dt * 1000;

      pieces.forEach((p) => {
        // Update velocity with gravity
        p.vel.addScaledVector(gravity, dt);
        // Integrate position
        p.mesh.position.addScaledVector(p.vel, dt * 60);
        // Rotate
        p.mesh.rotation.x += p.rot.x;
        p.mesh.rotation.y += p.rot.y;
        p.mesh.rotation.z += p.rot.z;

        // Fade near the end
        if (elapsedTotal > durationMs * 0.7) {
          p.life = Math.max(0, 1 - (elapsedTotal - durationMs * 0.7) / (durationMs * 0.3));
          const m = p.mesh.material as THREE.MeshPhongMaterial;
          m.opacity = p.life;
        }

        // Recycle piece when out of view (returns to top)
        if (p.mesh.position.y < -(height / 50) - 4) {
          p.mesh.position.set((Math.random() - 0.5) * 28, height / 60 + Math.random() * 6, (Math.random() - 0.5) * 6);
          p.vel.set((Math.random() - 0.5) * 0.6, -0.6 - Math.random() * 0.9, (Math.random() - 0.5) * 0.2);
          p.rot.set((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2);
        }
      });

      renderer.render(scene, camera);

      if (elapsedTotal >= durationMs) {
        // End animation gracefully
        if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
        onComplete?.();
        return;
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      // Cleanup scene
      pieces.forEach((p) => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
      });
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [durationMs, onComplete]);

  return <div ref={containerRef} className={className} />;
}


