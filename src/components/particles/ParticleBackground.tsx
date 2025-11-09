'use client';

// This section imports the necessary tools from React.
import React, { useRef, useEffect, useState } from 'react';
// This imports a hook that tells us which theme (light or dark) is active.
import { useTheme } from 'next-themes';

// This is the main component for the animated background.
const ParticleBackground = () => {
  // This creates a "ref" to the canvas element, allowing us to directly interact with it.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // This gets the current theme ('light' or 'dark') from the ThemeProvider.
  const { theme } = useTheme();
  // This holds the ID of the animation frame, so we can stop it when needed.
  const animationFrameId = useRef<number>();
  // This state helps prevent errors by making sure the component has loaded in the browser before trying to draw.
  const [hasMounted, setHasMounted] = useState(false);

  // This runs once when the component is first added to the page.
  useEffect(() => {
    // It sets 'hasMounted' to true, signaling that we are now in the browser.
    setHasMounted(true);
  }, []); // The empty array [] means this runs only once.

  // This is the main effect that creates and runs the animation.
  // It re-runs whenever the theme changes or when the component has mounted.
  useEffect(() => {
    // If the component hasn't mounted in the browser yet, do nothing.
    if (!hasMounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return; // If we can't find the canvas, stop.
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // If we can't get the drawing context, stop.

    // Set the canvas size to fill the entire window.
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // This function runs whenever the browser window is resized.
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init(); // Re-initialize the animation with the new size.
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = []; // This array will hold all our particle objects.
    let moon: Moon; // This will hold our moon object.

    // This "class" is a blueprint for creating the Moon object.
    class Moon {
      x: number; y: number; radius: number; haloRadius: number; scale: number; scaleDirection: number;

      constructor() {
        // Position the moon in the upper right corner.
        this.x = width * 0.75; 
        this.y = height * 0.25;
        // Set the moon's size based on the window size.
        this.radius = Math.max(120, Math.min(width, height) * 0.20);
        this.haloRadius = this.radius * 1.5;
        this.scale = 1;
        this.scaleDirection = 1; // Used for a subtle pulsing effect.
      }

      draw() {
        // Draw the glowing halo behind the moon.
        const haloGradient = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, this.haloRadius * this.scale);
        haloGradient.addColorStop(0, 'rgba(208, 216, 255, 0.06)');
        haloGradient.addColorStop(1, 'rgba(208, 216, 255, 0)');
        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.haloRadius * this.scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the main body of the moon.
        ctx.fillStyle = '#d0d8ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.shadowColor = '#d0d8ff';
        ctx.shadowBlur = 30; // This adds a nice glow.
        ctx.fill();
        ctx.shadowBlur = 0; // Reset the glow so it doesn't affect other elements.
      }
      
      update() {
         // This creates a gentle "breathing" or "pulsing" effect for the halo.
         this.scale += 0.0005 * this.scaleDirection;
         if(this.scale > 1.01 || this.scale < 0.99) {
             this.scaleDirection *= -1; // Reverse the direction when it gets too big or too small.
         }
      }
    }

    // This "class" is a blueprint for creating each individual particle (star).
    class Particle {
      x: number; y: number; vx: number; vy: number; size: number; color: string; opacity: number; opacityDirection: number; flickerPhase: number; flickerSpeed: number;

      constructor() {
        // Start each particle at a random position on the screen.
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.flickerPhase = Math.random() * Math.PI * 2;
        this.flickerSpeed = Math.random() * 0.02 + 0.01;

        // The particles behave differently depending on the theme.
        if (theme === 'dark') { // In dark mode, they are like distant stars.
          this.vx = (Math.random() - 0.5) * 0.3; // Slow, drifting horizontal speed.
          this.vy = (Math.random() - 0.5) * 0.3; // Slow, drifting vertical speed.
          this.size = Math.random() * 1.5 + 0.5; // Small size.
          this.opacity = Math.random() * 0.8 + 0.2;
          this.color = `hsla(50, 100%, 90%, ${this.opacity})`;
        } else { // In light mode, they are like rising embers.
          this.vx = (Math.random() - 0.5) * 0.2; // Slight horizontal drift.
          this.vy = -(Math.random() * 1 + 0.5); // Always move upwards.
          this.size = Math.random() * 2 + 1; // Slightly larger size.
          this.opacity = Math.random() * 0.5 + 0.3;
          this.color = `hsla(${Math.random() * 30 + 15}, 100%, 70%, ${this.opacity})`;
        }
      }

      update() {
        // Move the particle based on its velocity.
         this.x += this.vx;
         this.y += this.vy;

        if (theme === 'dark') {
          // This code makes the stars twinkle in dark mode.
          this.flickerPhase += this.flickerSpeed;
          const flicker = 0.7 + 0.3 * Math.sin(this.flickerPhase);
          this.color = `hsla(50, 100%, 90%, ${this.opacity * flicker})`;

          // If a particle goes off-screen, wrap it around to the other side.
          if (this.x < 0) this.x = width;
          if (this.x > width) this.x = 0;
          if (this.y < 0) this.y = height;
          if (this.y > height) this.y = 0;
        } else {
            // If a particle goes off the top of the screen in light mode, reset it to the bottom.
            if(this.y < 0) {
                this.y = height;
                this.x = Math.random() * width;
            }
        }
      }

      draw() {
        // This function draws the particle on the canvas.
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // This function sets up the animation.
    function init() {
      particles.length = 0; // Clear any old particles.
      // Use fewer particles on smaller screens to save performance.
      const particleCount = window.innerWidth < 768 ? 40 : 120;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
      // Only create the moon if the theme is dark.
      if (theme === 'dark') {
        moon = new Moon();
      }
    }
    
    // This is the main animation loop. It runs over and over to create movement.
    function animate() {
      // Set the background color based on the theme.
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
      ctx.fillRect(0, 0, width, height); // Clear the canvas with the new background.

      // If it's dark mode and the moon exists, update and draw it.
      if (theme === 'dark' && moon) {
          moon.update();
          moon.draw();
      }

      // Update and draw every single particle.
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Request the browser to run this 'animate' function again for the next frame.
      animationFrameId.current = requestAnimationFrame(animate);
    }

    // This handles pausing the animation when the tab is not visible to save battery/power.
    const handleVisibilityChange = () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId.current!);
        } else {
            animationFrameId.current = requestAnimationFrame(animate);
        }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    init(); // Set up the animation.
    animate(); // Start the animation loop.

    // This is the cleanup function. It runs when the component is removed from the page.
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current); // Stop the animation.
      }
    };
  }, [theme, hasMounted]); // The animation will re-run if 'theme' or 'hasMounted' changes.
  
  if (!hasMounted) {
    // If the component hasn't loaded in the browser yet, show nothing to prevent errors.
    return null;
  }

  // This returns the actual <canvas> element that the animation is drawn on.
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
