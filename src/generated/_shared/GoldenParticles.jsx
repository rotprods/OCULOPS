import React, { useRef, useEffect } from 'react';

interface GoldenParticlesProps {
  count?: number;
  speed?: number;
  opacity?: number;
}

type Particle = {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  opacity: number;
  angle: number;
  angleSpeed: number;
  amplitude: number;
};

export const GoldenParticles: React.FC<GoldenParticlesProps> = ({
  count = 30,
  speed = 1,
  opacity = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const parent = canvas.parentElement;
    const resizeObserver = new ResizeObserver(() => {
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    });

    if (parent) {
      resizeObserver.observe(parent);
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 2,
          speedY: (Math.random() * 0.3 + 0.2) * speed,
          opacity: (Math.random() * 0.5 + 0.1) * opacity,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: Math.random() * 0.02 + 0.01,
          amplitude: Math.random() * 1.5 + 0.5
        });
      }
    };

    initParticles();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.y -= p.speedY;
        p.angle += p.angleSpeed;
        p.x += Math.sin(p.angle) * p.amplitude * 0.5;

        if (p.y < -p.radius - 10) {
          p.y = canvas.height + p.radius + 10;
          p.x = Math.random() * canvas.width;
          p.radius = Math.random() * 3 + 2;
          p.speedY = (Math.random() * 0.3 + 0.2) * speed;
          p.opacity = (Math.random() * 0.5 + 0.1) * opacity;
          p.angle = Math.random() * Math.PI * 2;
          p.angleSpeed = Math.random() * 0.02 + 0.01;
          p.amplitude = Math.random() * 1.5 + 0.5;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (parent) {
        resizeObserver.unobserve(parent);
      }
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, speed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: 'transparent'
      }}
    />
  );
};

export default GoldenParticles;