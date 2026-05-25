import React, { useEffect, useRef } from 'react';
import soundEffects from '../utils/sound';

interface BiddingEffectsOverlayProps {
  status: 'sold' | 'unsold' | null;
  playerName: string;
  playerRole?: string;
  teamName?: string;
  teamLogoUrl?: string;
  teamColor?: string;
  amountStr?: string;
  onClose: () => void;
}

export const BiddingEffectsOverlay: React.FC<BiddingEffectsOverlayProps> = ({
  status,
  playerName,
  playerRole = 'All-Rounder',
  teamName = 'Chennai Super Kings',
  teamLogoUrl = '/logos/csk.png',
  teamColor = '#FFCB05',
  amountStr = '12.00 Crore',
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!status) return;

    // Trigger synthesised sound effects
    if (status === 'sold') {
      soundEffects.playSoldSound();
      // Slight delay for crowd cheer swell
      const timer = setTimeout(() => {
        soundEffects.playCrowdCheer();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      soundEffects.playSoftBell();
    }
  }, [status]);

  useEffect(() => {
    if (!status || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle classes
    class GoldBurstParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      radius: number;
      alpha: number;
      decay: number;
      gravity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 6;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 3.5 + 1.5;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        this.gravity = 0.08;

        const goldShades = ['#10B981', '#34D399', '#6EE7B7', '#059669', '#A7F3D0', '#FFF'];
        this.color = goldShades[Math.floor(Math.random() * goldShades.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.alpha -= this.decay;
      }

      draw(context: CanvasRenderingContext2D) {
        context.save();
        context.globalAlpha = this.alpha;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.shadowBlur = 12;
        context.shadowColor = '#FFD700';
        context.fill();
        context.restore();
      }
    }

    class ConfettiParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      w: number;
      h: number;
      rotation: number;
      rotationSpeed: number;
      oscillationSpeed: number;
      oscillationAmplitute: number;
      time: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height - 20;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 3 + 2;
        this.w = Math.random() * 8 + 6;
        this.h = Math.random() * 12 + 8;
        this.rotation = Math.random() * Math.PI;
        this.rotationSpeed = Math.random() * 0.08 - 0.04;
        this.oscillationSpeed = Math.random() * 0.03 + 0.01;
        this.oscillationAmplitute = Math.random() * 30 + 10;
        this.time = Math.random() * 100;

        const colors = [
          '#FFC107', '#E91E63', '#9C27B0', '#00BCD4', '#4CAF50',
          '#FF5722', '#2196F3', '#FFEB3B', '#FFCB05', '#E31837'
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.time += this.oscillationSpeed;
        this.x += this.vx + Math.sin(this.time) * 0.8;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        if (this.y > height + 20) {
          this.y = -20;
          this.x = Math.random() * width;
        }
      }

      draw(context: CanvasRenderingContext2D) {
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.rotation);
        context.fillStyle = this.color;
        context.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        context.restore();
      }
    }

    class CameraFlash {
      x: number;
      y: number;
      maxRadius: number;
      radius: number;
      alpha: number;
      decay: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.maxRadius = Math.random() * 180 + 100;
        this.radius = 0;
        this.alpha = Math.random() * 0.4 + 0.2;
        this.decay = Math.random() * 0.02 + 0.01;
      }

      update() {
        this.radius += (this.maxRadius - this.radius) * 0.12;
        this.alpha -= this.decay;
      }

      draw(context: CanvasRenderingContext2D) {
        if (this.alpha <= 0) return;
        context.save();
        context.globalAlpha = this.alpha;
        const grad = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.fillStyle = grad;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    }

    // Collections
    const goldParticles: GoldBurstParticle[] = [];
    const confetti: ConfettiParticle[] = [];
    let flashes: CameraFlash[] = [];

    // Trigger gold burst from center
    if (status === 'sold') {
      const centerX = width / 2;
      const centerY = height / 2;
      for (let i = 0; i < 160; i++) {
        goldParticles.push(new GoldBurstParticle(centerX, centerY));
      }

      // Add general falling confetti
      for (let i = 0; i < 90; i++) {
        confetti.push(new ConfettiParticle());
      }
    }

    // Main animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Camera Flashes occasionally
      if (status === 'sold' && Math.random() < 0.07 && flashes.length < 5) {
        flashes.push(new CameraFlash());
      }

      flashes.forEach((f) => {
        f.update();
        f.draw(ctx);
      });
      flashes = flashes.filter((f) => f.alpha > 0);

      // Draw Gold Burst particles
      goldParticles.forEach((p, idx) => {
        p.update();
        if (p.alpha <= 0) {
          goldParticles.splice(idx, 1);
        } else {
          p.draw(ctx);
        }
      });

      // Draw Confetti
      confetti.forEach((c) => {
        c.update();
        c.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Auto-dismiss setup
    const autoCloseTime = status === 'sold' ? 7000 : 3800;
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, autoCloseTime);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(autoCloseTimer);
    };
  }, [status, onClose]);

  if (!status) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md transition-opacity duration-500 ease-out ${status ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Background canvas for premium visual particle simulations */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

      {/* SOLD CELEBRATION MODAL */}
      {status === 'sold' && (
        <div className="relative max-w-md w-full mx-4 flex flex-col items-center bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden scale-in-animation">
          {/* Elegant background halo glow matching team's brand color */}
          <div 
            className="absolute -top-32 w-72 h-72 rounded-full blur-[80px] opacity-40 pointer-events-none transition-all duration-700" 
            style={{ backgroundColor: teamColor }} 
          />

          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400 mb-2 font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            ⚡ Live Auction Result ⚡
          </div>

          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 uppercase tracking-widest mb-6 font-sans drop-shadow-[0_0_12px_rgba(16,185,129,0.4)] sold-glow-anim">
            SOLD!
          </h2>

          {/* Scaled-up Glowing Neon Winning Team Container */}
          <div 
            className="relative w-36 h-36 flex items-center justify-center bg-slate-800 border-2 rounded-full p-4 mb-6 transition-all duration-500 team-logo-glow"
            style={{ 
              borderColor: teamColor,
              boxShadow: `0 0 35px ${teamColor}50, inset 0 0 15px ${teamColor}30` 
            }}
          >
            {teamLogoUrl ? (
              <img 
                src={teamLogoUrl} 
                alt={teamName} 
                className="w-24 h-24 object-contain team-logo-spin" 
              />
            ) : (
              <div className="text-2xl font-black text-white">{teamName.slice(0, 3).toUpperCase()}</div>
            )}
            {/* Visual sound ring decoration */}
            <div 
              className="absolute inset-0 rounded-full border border-dashed opacity-30 animate-[spin_10s_linear_infinite]"
              style={{ borderColor: teamColor }}
            />
          </div>

          <div className="z-10 mb-6">
            <h3 className="text-2xl font-extrabold text-white tracking-wide">{playerName}</h3>
            <span className="text-[12px] text-slate-400 font-medium px-3 py-1 bg-slate-800/90 rounded-full border border-slate-700 inline-block mt-1 font-mono">
              {playerRole}
            </span>
          </div>

          {/* Luxury purchase slip badge */}
          <div className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 mb-6 backdrop-blur-sm shadow-inner text-left flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider font-mono">Purchasing Franchise</span>
              <span className="text-white font-bold tracking-wide" style={{ color: teamColor }}>{teamName}</span>
            </div>
            <div className="h-[1px] bg-slate-700" />
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Final Bid Amount</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 font-mono">
                ₹{amountStr}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="z-10 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold tracking-widest text-sm shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            NEXT PLAYER
          </button>
        </div>
      )}

      {/* UNSOLD SOMBER OVERLAY */}
      {status === 'unsold' && (
        <div className="relative max-w-sm w-full mx-4 flex flex-col items-center bg-zinc-950/80 border border-zinc-800/60 p-8 rounded-3xl text-center shadow-[0_0_40px_rgba(239,68,68,0.05)] scale-in-animation">
          <div className="absolute -top-32 w-64 h-64 rounded-full bg-red-600/10 blur-[80px] opacity-40 pointer-events-none" />

          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-500 mb-2 font-mono">
            ⚠️ Live Auction Result ⚠️
          </div>

          <h2 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-4 font-sans drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            UNSOLD
          </h2>

          <div className="w-16 h-1 bg-red-600/30 rounded-full mb-6" />

          <div className="mb-6">
            <h3 className="text-xl font-bold text-zinc-300 tracking-wide">{playerName}</h3>
            <span className="text-[11px] text-zinc-500 font-medium px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800/40 inline-block mt-1 font-mono">
              {playerRole}
            </span>
          </div>

          <p className="text-zinc-500 text-xs leading-relaxed mb-6 max-w-[280px]">
            No franchises placed bids at the base reserve price of <span className="text-zinc-400 font-semibold font-mono">₹{amountStr}</span>. This player returns to the pool.
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 font-bold tracking-wide text-xs transition-all duration-200 hover:text-white"
          >
            CONTINUE
          </button>
        </div>
      )}

      {/* Embedded Dynamic CSS for Special Animation Effects */}
      <style jsx global>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .scale-in-animation {
          animation: scaleIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes glowText {
          0%, 100% {
            text-shadow: 0 0 10px rgba(255,203,5,0.4), 0 0 20px rgba(255,203,5,0.2);
          }
          50% {
            text-shadow: 0 0 20px rgba(255,203,5,0.6), 0 0 35px rgba(255,203,5,0.3);
          }
        }
        .sold-glow-anim {
          animation: glowText 2.5s ease-in-out infinite;
        }
        @keyframes pulseLogoGlow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }
        .team-logo-glow {
          animation: pulseLogoGlow 3s ease-in-out infinite;
        }
        @keyframes logoRotation {
          0% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
          100% {
            transform: rotate(-3deg);
          }
        }
        .team-logo-spin {
          animation: logoRotation 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BiddingEffectsOverlay;
