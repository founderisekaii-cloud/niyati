'use client';

import React, { useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationFrameId: number;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles: Particle[] = [];
    const particleCount = 100;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      initialY: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.initialY = this.y;

        if (theme === 'dark') {
          // Drifting stars
          this.vx = Math.random() * 0.4 - 0.2;
          this.vy = Math.random() * 0.4 - 0.2;
          this.size = Math.random() * 1.5 + 0.5;
          this.color = 'hsla(45, 100%, 90%, 0.8)';
        } else {
          // Rising embers
          this.vx = Math.random() * 0.2 - 0.1;
          this.vy = -(Math.random() * 1.5 + 0.5);
          this.size = Math.random() * 2 + 1;
          this.color = `hsla(${Math.random() * 30 + 15}, 100%, 50%, ${Math.random() * 0.5 + 0.3})`;
        }
      }

      update() {
        if (theme === 'dark') {
          this.x += this.vx;
          this.y += this.vy;

          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;
        } else {
            this.x += this.vx;
            this.y += this.vy;
            if (this.y < -this.size) {
                this.y = height + this.size;
                this.x = Math.random() * width;
            }
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    function init() {
      particles.length = 0; // Clear existing particles
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    }

    init();
    animate();
    
    return () => {
        window.cancelAnimationFrame(animationFrameId);
    }

  }, [theme]); // Rerun effect when theme changes

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
        opacity: theme === 'dark' ? 0.7 : 1,
        transition: 'opacity 0.5s ease-in-out',
      }}
    />
  );
};

export default ParticleBackground;
