"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacitySpeed: number;
  hue: number; // 0 = Diamond White, 270 = Electric Violet, 285 = Soft Lavender
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const animationRef = useRef<number>(0);
  const isVisibleRef = useRef(true);

  const initParticles = useCallback((width: number, height: number) => {
    // Elegant count of stars based on viewport
    const count = Math.min(Math.floor((width * height) / 32000), 45);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x,
        y,
        originX: x,
        originY: y,
        size: Math.random() * 1.8 + 0.6,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.2 - 0.08,
        opacity: Math.random() * 0.5 + 0.15,
        opacitySpeed: (Math.random() - 0.5) * 0.008,
        // 40% Electric Violet (270) / Soft Lavender (285), 60% Diamond White (0)
        hue: Math.random() > 0.6 ? (Math.random() > 0.5 ? 270 : 285) : 0,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initParticles(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking for subtle interactive gravitational effect
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);

    // Pause when tab is inactive
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let lastFrameTime = 0;
    const targetFpsInterval = 1000 / 30; // Smooth 30 FPS throttle
    let nextShootingStarTime = Date.now() + Math.random() * 3000 + 2000;

    const spawnShootingStar = (w: number) => {
      shootingStarsRef.current.push({
        x: Math.random() * (w * 0.8) + w * 0.1,
        y: Math.random() * 120,
        length: Math.random() * 80 + 70,
        speed: Math.random() * 8 + 12,
        angle: (Math.PI / 4) + (Math.random() - 0.5) * 0.2, // ~45 degrees diagonal
        opacity: 0.9,
        active: true,
      });
    };

    const animate = (currentTime: number) => {
      animationRef.current = requestAnimationFrame(animate);

      if (!isVisibleRef.current) return;

      const elapsed = currentTime - lastFrameTime;
      if (elapsed < targetFpsInterval) return;
      lastFrameTime = currentTime - (elapsed % targetFpsInterval);

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Periodically spawn a shooting star
      const now = Date.now();
      if (now > nextShootingStarTime) {
        if (shootingStarsRef.current.length < 2) {
          spawnShootingStar(w);
        }
        nextShootingStarTime = now + Math.random() * 5000 + 4000; // Next star in 4-9 seconds
      }

      // Draw and update shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((star) => {
        if (!star.active) return false;

        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;

        const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        gradient.addColorStop(0.2, `rgba(167, 139, 250, ${star.opacity * 0.8})`); // Soft Lavender
        gradient.addColorStop(0.6, `rgba(139, 92, 246, ${star.opacity * 0.4})`); // Electric Violet
        gradient.addColorStop(1, "rgba(139, 92, 246, 0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Glowing star head
        ctx.beginPath();
        ctx.arc(star.x, star.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.shadowColor = "#8B5CF6";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Advance shooting star
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.opacity -= 0.015;

        if (star.opacity <= 0 || star.x > w + 100 || star.y > h + 100) {
          star.active = false;
        }
        return star.active;
      });

      // Draw and update ambient cosmic stars
      const mouse = mouseRef.current;
      particlesRef.current.forEach((p) => {
        // Natural drift
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.opacitySpeed;

        if (p.opacity <= 0.08 || p.opacity >= 0.7) {
          p.opacitySpeed *= -1;
        }

        // Gentle interactive mouse push / attraction
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 130;

          if (dist < maxDist && dist > 0) {
            const force = (maxDist - dist) / maxDist;
            // Soft repel effect
            p.x -= (dx / dist) * force * 1.5;
            p.y -= (dy / dist) * force * 1.5;
            // Temporarily twinkle brighter
            p.opacity = Math.min(0.9, p.opacity + 0.05);
          }
        }

        // Wrap around viewport smoothly
        if (p.x < -15) p.x = w + 15;
        if (p.x > w + 15) p.x = -15;
        if (p.y < -15) p.y = h + 15;
        if (p.y > h + 15) p.y = -15;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        if (p.hue > 0) {
          // Electric Violet or Soft Lavender star
          ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${p.opacity})`;
          // Subtle glow on larger violet stars
          if (p.size > 1.2 && p.opacity > 0.4) {
            ctx.shadowColor = "rgba(139, 92, 246, 0.6)";
            ctx.shadowBlur = 6;
          }
        } else {
          // Diamond White star
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.75})`;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.85 }}
      aria-hidden="true"
    />
  );
}
