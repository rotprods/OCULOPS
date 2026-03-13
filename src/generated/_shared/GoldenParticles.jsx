import React, { useRef, useEffect } from 'react';

export default function GoldenParticles({ count = 30, speed = 1, opacity = 1 }) {
  const canvasRef = useRef(null);
  const configRef = useRef({ speed, opacity });

  useEffect(() => {
    configRef.current = { speed, opacity };
  }, [speed, opacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const parent = canvas.parentElement;
    const resizeObserver = new ResizeObserver(() => {
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    });

    if (parent) {
      resizeObserver.observe(parent);
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          baseX: Math.random() * canvas.width,
          x: 0,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 2,
          speedY: Math.random() * 0.3 + 0.2,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: Math.random() * 0.015 + 0.005,
          amplitude: Math.random() * 15 + 5,
          baseOpacity: Math.random() * 0.5 + 0.1
        });
      }
    };

    initParticles();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentSpeed = configRef.current.speed;
      const currentOpacity = configRef.current.opacity;

      particles.forEach((p) => {
        p.y -= p.speedY * currentSpeed;
        p.angle += p.angleSpeed * currentSpeed;
        p.x = p.baseX + Math.sin(p.angle) * p.amplitude;

        if (p.y + p.radius < 0) {
          p.y = canvas.height + p.radius;
          p.baseX = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${p.baseOpacity * currentOpacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (parent) resizeObserver.unobserve(parent);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10
      }}
    />
  );
}