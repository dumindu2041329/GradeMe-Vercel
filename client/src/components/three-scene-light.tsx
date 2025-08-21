import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeSceneLightProps {
  className?: string;
}

export function ThreeSceneLight({ className = '' }: ThreeSceneLightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup with beautiful gradient background
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xe0f2fe, 1, 100);
    scene.background = new THREE.Color(0xf0f9ff);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 12);

    // Renderer setup for light mode
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Bright ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light with soft shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 15, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Vibrant colored point lights
    const pointLight1 = new THREE.PointLight(0x3b82f6, 0.6, 30); // Bright Blue
    pointLight1.position.set(8, 8, 8);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 0.6, 30); // Purple
    pointLight2.position.set(-8, -8, 8);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xf59e0b, 0.5, 25); // Orange
    pointLight3.position.set(0, 0, 15);
    scene.add(pointLight3);

    const pointLight4 = new THREE.PointLight(0x10b981, 0.4, 20); // Emerald
    pointLight4.position.set(-10, 10, 5);
    scene.add(pointLight4);

    // Light-themed geometric shapes
    const geometries = [
      new THREE.IcosahedronGeometry(1.2, 0),
      new THREE.DodecahedronGeometry(1),
      new THREE.OctahedronGeometry(1.1),
      new THREE.TetrahedronGeometry(1),
      new THREE.TorusGeometry(0.8, 0.3, 16, 100),
      new THREE.TorusKnotGeometry(0.6, 0.2, 100, 16),
      new THREE.ConeGeometry(0.8, 1.5, 8),
      new THREE.SphereGeometry(0.9, 32, 32),
    ];

    // Vibrant and beautiful materials for light mode
    const materials = [
      new THREE.MeshPhongMaterial({ 
        color: 0x3b82f6, // Bright Blue
        transparent: true,
        opacity: 0.8,
        shininess: 100,
        specular: 0xffffff
      }),
      new THREE.MeshLambertMaterial({ 
        color: 0x8b5cf6, // Purple
        transparent: true,
        opacity: 0.7,
        wireframe: false
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0xf59e0b, // Orange
        transparent: true,
        opacity: 0.75,
        shininess: 80,
        specular: 0xffffff
      }),
      new THREE.MeshLambertMaterial({ 
        color: 0x10b981, // Emerald
        transparent: true,
        opacity: 0.8
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0x06b6d4, // Cyan
        transparent: true,
        opacity: 0.7,
        shininess: 120,
        specular: 0xffffff
      }),
      new THREE.MeshLambertMaterial({ 
        color: 0xf97316, // Bright Orange
        transparent: true,
        opacity: 0.6,
        wireframe: true
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0x84cc16, // Lime Green
        transparent: true,
        opacity: 0.75,
        shininess: 90
      }),
      new THREE.MeshLambertMaterial({ 
        color: 0x6366f1, // Indigo
        transparent: true,
        opacity: 0.65
      }),
    ];

    const meshes: THREE.Mesh[] = [];

    // Create elegant floating objects
    for (let i = 0; i < 10; i++) {
      const geometry = geometries[i % geometries.length];
      const material = materials[i % materials.length];
      const mesh = new THREE.Mesh(geometry, material);

      // Gentle positioning for light mode
      mesh.position.x = (Math.random() - 0.5) * 20;
      mesh.position.y = (Math.random() - 0.5) * 12;
      mesh.position.z = (Math.random() - 0.5) * 15 - 3;

      // Random rotation
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;

      // Enable shadows
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add(mesh);
      meshes.push(mesh);
    }

    // Light-themed particle system
    const particleCount = 150;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      // Vibrant colors for beautiful light mode
      const colors = [
        [0.23, 0.51, 0.96], // Bright Blue
        [0.55, 0.36, 0.96], // Purple  
        [0.96, 0.62, 0.07], // Orange
        [0.06, 0.71, 0.51], // Emerald
        [0.02, 0.71, 0.83], // Cyan
        [0.52, 0.80, 0.09], // Lime Green
        [0.39, 0.40, 0.95], // Indigo
      ];
      const colorIndex = Math.floor(Math.random() * colors.length);
      particleColors[i * 3] = colors[colorIndex][0];
      particleColors[i * 3 + 1] = colors[colorIndex][1];
      particleColors[i * 3 + 2] = colors[colorIndex][2];
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Mouse interaction
    const mouse = new THREE.Vector2();
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    container.addEventListener('mousemove', handleMouseMove);

    // Gentle animation loop for light mode
    const clock = new THREE.Clock();
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle camera movement
      camera.position.x = Math.sin(elapsedTime * 0.05) * 1;
      camera.position.y = Math.cos(elapsedTime * 0.04) * 0.5;
      camera.lookAt(0, 0, 0);

      // Gentle mesh animations
      meshes.forEach((mesh, index) => {
        const speed = 0.3 + index * 0.05;
        
        // Slow rotation
        mesh.rotation.x += 0.005 * speed;
        mesh.rotation.y += 0.003 * speed;
        mesh.rotation.z += 0.002 * speed;
        
        // Soft floating motion
        const radius = 6 + index * 1;
        const angle = elapsedTime * 0.2 + index * 0.3;
        mesh.position.x = Math.cos(angle) * radius + Math.sin(elapsedTime * 0.5 + index) * 1;
        mesh.position.y = Math.sin(angle) * radius * 0.3 + Math.cos(elapsedTime * 0.4 + index) * 0.8;
        mesh.position.z = Math.sin(elapsedTime * 0.3 + index) * 2;

        // Gentle scale pulsing
        const scale = 1 + Math.sin(elapsedTime * 1.5 + index) * 0.05;
        mesh.scale.setScalar(scale);
      });

      // Animate particles softly
      const positions = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(elapsedTime * 0.5 + i * 0.01) * 0.005;
        positions[i * 3] += Math.cos(elapsedTime * 0.3 + i * 0.02) * 0.003;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      // Rotate particle system gently
      particleSystem.rotation.y = elapsedTime * 0.05;

      // Soft lighting movement
      pointLight1.position.x = Math.sin(elapsedTime * 0.3) * 10;
      pointLight1.position.z = Math.cos(elapsedTime * 0.3) * 10;
      pointLight2.position.x = Math.cos(elapsedTime * 0.2) * 10;
      pointLight2.position.z = Math.sin(elapsedTime * 0.2) * 10;

      // Gentle mouse interaction
      meshes.forEach((mesh, index) => {
        const distance = mesh.position.distanceTo(camera.position);
        const mouseInfluence = 1 - Math.min(distance / 25, 1);
        mesh.position.x += mouse.x * mouseInfluence * 0.05;
        mesh.position.y += mouse.y * mouseInfluence * 0.05;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      
      rendererRef.current.setSize(newWidth, newHeight);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of all resources
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      particleGeometry.dispose();
      particleMaterial.dispose();
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}