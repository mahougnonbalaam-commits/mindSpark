import React, { useEffect, useState } from 'react';
import { Sparkles, Heart, Check, X, Flame } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  type: 'dot' | 'sparkle' | 'heart' | 'ring';
}

interface SwipeParticlesProps {
  type: 'keep' | 'pass' | null;
  onDone?: () => void;
}

export const SwipeParticles: React.FC<SwipeParticlesProps> = ({ type, onDone }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!type) {
      setParticles([]);
      setVisible(false);
      return;
    }

    setVisible(true);

    const count = type === 'keep' ? 24 : 14;
    const newParticles: Particle[] = [];

    const keepColors = ['#10B981', '#34D399', '#A855F7', '#F59E0B', '#3B82F6', '#6EE7B7'];
    const passColors = ['#F43F5E', '#FB7185', '#94A3B8', '#CBD5E1', '#E2E8F0'];

    for (let i = 0; i < count; i++) {
      const angle =
        type === 'keep'
          ? (Math.random() * Math.PI) - (Math.PI / 4) // Angled rightward and upward
          : Math.PI + (Math.random() * Math.PI / 2) - (Math.PI / 4); // Angled leftward

      const speed = 6 + Math.random() * 12;
      const colors = type === 'keep' ? keepColors : passColors;

      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'keep' ? 4 : 1),
        size: 8 + Math.random() * 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        type: type === 'keep'
          ? (i % 3 === 0 ? 'sparkle' : i % 4 === 0 ? 'heart' : 'dot')
          : (i % 3 === 0 ? 'sparkle' : 'dot')
      });
    }

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setVisible(false);
      if (onDone) onDone();
    }, 700);

    return () => clearTimeout(timer);
  }, [type, onDone]);

  if (!visible || !type) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {/* Central Big Floating Stamp Badge */}
      <div
        className={`animate-swipe-pop flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-lg sm:text-xl shadow-2xl backdrop-blur-xl border ${
          type === 'keep'
            ? 'bg-emerald-500/90 text-white border-emerald-300 shadow-emerald-500/40'
            : 'bg-rose-500/90 text-white border-rose-300 shadow-rose-500/40'
        }`}
      >
        {type === 'keep' ? (
          <>
            <Check className="w-6 h-6 stroke-[3] animate-bounce" />
            <span>IDÉE VALIDÉE ! 💚</span>
          </>
        ) : (
          <>
            <X className="w-6 h-6 stroke-[3]" />
            <span>IDÉE PASSÉE ❌</span>
          </>
        )}
      </div>

      {/* Particle Explosions */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            '--tx': `${p.vx * 22}px`,
            '--ty': `${p.vy * 22 + (type === 'keep' ? -30 : 20)}px`,
            '--rot': `${p.rotation + 180}deg`,
            backgroundColor: p.type === 'dot' ? p.color : 'transparent',
            color: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
          } as React.CSSProperties}
          className="absolute rounded-full animate-particle flex items-center justify-center"
        >
          {p.type === 'sparkle' && <Sparkles className="w-full h-full fill-current" />}
          {p.type === 'heart' && <Heart className="w-full h-full fill-current" />}
        </div>
      ))}
    </div>
  );
};
