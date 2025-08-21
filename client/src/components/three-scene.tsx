import React, { useState, useEffect, useRef } from 'react';

interface ThreeSceneProps {
  className?: string;
}

export function ThreeScene({ className = '' }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLFailed, setWebGLFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Create a simple canvas animation instead of ThreeJS
    // This avoids WebGL errors in environments that don't support it
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setWebGLFailed(true);
      return;
    }

    // Set canvas dimensions to match container
    const updateCanvasSize = () => {
      if (!containerRef.current || !canvas) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Create particles
    const particles: { x: number; y: number; radius: number; color: string; vx: number; vy: number }[] = [];
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    
    // Create initial particles
    for (let i = 0; i < 100; i++) {
      const size = Math.random() * 5 + 2;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: size,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1
      });
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        // Move particles
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -1;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy *= -1;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        
        // Draw connecting lines between nearby particles
        particles.forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = 0.2 * (1 - distance / 100);
            ctx.stroke();
          }
        });
      });
      
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Render canvas element with fallback
  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full overflow-hidden ${className}`}
      style={{ minHeight: '400px', position: 'relative' }}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />
      {webGLFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-center p-4 bg-gradient-to-r from-blue-500/30 to-indigo-500/30">
          <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Interactive Background</h3>
            <p>A dynamic particle animation for your educational experience.</p>
          </div>
        </div>
      )}
    </div>
  );
}