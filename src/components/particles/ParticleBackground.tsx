'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const animationFrameId = useRef<number>();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    let moon: Moon;

    class Moon {
      x: number;
      y: number;
      radius: number;
      haloRadius: number;
      scale: number;
      scaleDirection: number;

      constructor() {
        this.x = width * 0.25;
        this.y = height * 0.4;
        this.radius = Math.max(120, Math.min(width, height) * 0.20);
        this.haloRadius = this.radius * 1.5;
        this.scale = 1;
        this.scaleDirection = 1;
      }

      draw() {
        // Halo
        const haloGradient = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, this.haloRadius * this.scale);
        haloGradient.addColorStop(0, 'rgba(208, 216, 255, 0.06)');
        haloGradient.addColorStop(1, 'rgba(208, 216, 255, 0)');
        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.haloRadius * this.scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon body
        ctx.fillStyle = '#d0d8ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.shadowColor = '#d0d8ff';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      update() {
         this.scale += 0.0005 * this.scaleDirection;
         if(this.scale > 1.01 || this.scale < 0.99) {
             this.scaleDirection *= -1;
         }
      }
    }

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      opacity: number;
      opacityDirection: number;
      flickerPhase: number;
      flickerSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.flickerPhase = Math.random() * Math.PI * 2;
        this.flickerSpeed = Math.random() * 0.02 + 0.01;

        if (theme === 'dark') { // Silent Cosmos
          this.vx = (Math.random() - 0.5) * 0.3;
          this.vy = (Math.random() - 0.5) * 0.3;
          this.size = Math.random() * 1.5 + 0.5;
          this.opacity = Math.random() * 0.8 + 0.2;
          this.color = `hsla(50, 100%, 90%, ${this.opacity})`;
        } else { // Living Creation
          this.vx = (Math.random() - 0.5) * 0.2;
          this.vy = -(Math.random() * 1 + 0.5);
          this.size = Math.random() * 2 + 1;
          this.opacity = Math.random() * 0.5 + 0.3;
          this.color = `hsla(${Math.random() * 30 + 15}, 100%, 70%, ${this.opacity})`;
        }
      }

      update() {
         this.x += this.vx;
         this.y += this.vy;

        if (theme === 'dark') {
          this.flickerPhase += this.flickerSpeed;
          const flicker = 0.7 + 0.3 * Math.sin(this.flickerPhase);
          this.color = `hsla(50, 100%, 90%, ${this.opacity * flicker})`;

          if (this.x < 0) this.x = width;
          if (this.x > width) this.x = 0;
          if (this.y < 0) this.y = height;
          if (this.y > height) this.y = 0;
        } else {
            if(this.y < 0) {
                this.y = height;
                this.x = Math.random() * width;
            }
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function init() {
      particles.length = 0;
      const particleCount = window.innerWidth < 768 ? 40 : 120;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
      if (theme === 'dark') {
        moon = new Moon();
      }
    }
    
    function animate() {
      // Set background
      if(theme === 'dark') {
          const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/1.5);
          bgGradient.addColorStop(0, '#0b1120');
          bgGradient.addColorStop(1, '#000814');
          ctx.fillStyle = bgGradient;
      } else {
          const bgGradient = ctx.createRadialGradient(width/2, height, 0, width/2, height, height);
          bgGradient.addColorStop(0, '#ffd580');
          bgGradient.addColorStop(1, '#ffb86b');
          ctx.fillStyle = bgGradient;
      }
      ctx.fillRect(0, 0, width, height);

      if (theme === 'dark' && moon) {
          moon.update();
          moon.draw();
      }

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId.current = requestAnimationFrame(animate);
    }

    const handleVisibilityChange = () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId.current!);
        } else {
            animationFrameId.current = requestAnimationFrame(animate);
        }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [theme, hasMounted]);
  
  if (!hasMounted) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        width: '100%',
        height: '100%',
        backgroundColor: theme === 'dark' ? '#000814' : '#ffb86b',
        transition: 'background-color 0.7s ease',
      }}
    />
  );
};

export default ParticleBackground;
