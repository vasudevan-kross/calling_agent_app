'use client'

/**
 * AnimatedBackground
 * Renders drifting gradient orbs + a subtle grid behind all app pages.
 * Fixed-positioned so it stays behind scrollable content.
 * Pure CSS — zero runtime cost, no libraries.
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>

      {/* Base gradient */}
      <div className="absolute inset-0
        bg-gradient-to-br from-slate-50 via-white to-blue-50/30
        dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40"
      />

      {/* Subtle grid lines — light mode only */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Orb 1 — top-left, blue/indigo */}
      <div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full animate-drift-1 animate-glow"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(99,102,241,0.22), rgba(139,92,246,0.12) 55%, transparent 75%)',
          animationDelay: '0s',
        }}
      />

      {/* Orb 2 — top-right, violet/pink */}
      <div
        className="absolute -top-20 right-0 w-[480px] h-[480px] rounded-full animate-drift-2 animate-glow"
        style={{
          background: 'radial-gradient(circle at 60% 30%, rgba(168,85,247,0.18), rgba(236,72,153,0.10) 50%, transparent 75%)',
          animationDelay: '-6s',
        }}
      />

      {/* Orb 3 — bottom-left, cyan/blue */}
      <div
        className="absolute bottom-0 -left-20 w-[420px] h-[420px] rounded-full animate-drift-3 animate-glow"
        style={{
          background: 'radial-gradient(circle at 35% 65%, rgba(6,182,212,0.15), rgba(59,130,246,0.10) 50%, transparent 72%)',
          animationDelay: '-11s',
        }}
      />

      {/* Orb 4 — center-right, emerald */}
      <div
        className="absolute top-1/2 -right-32 w-[380px] h-[380px] rounded-full animate-drift-4 animate-glow"
        style={{
          background: 'radial-gradient(circle at 70% 50%, rgba(16,185,129,0.13), rgba(99,102,241,0.08) 50%, transparent 72%)',
          animationDelay: '-4s',
        }}
      />

      {/* Orb 5 — bottom-right, small accent */}
      <div
        className="absolute -bottom-16 right-1/4 w-[260px] h-[260px] rounded-full animate-drift-1 animate-glow"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.10), rgba(239,68,68,0.07) 55%, transparent 75%)',
          animationDelay: '-15s',
        }}
      />

      {/* Floating small dots */}
      {[
        { top: '18%',  left: '12%',  size: 4, delay: '0s',   dur: '7s'  },
        { top: '35%',  left: '88%',  size: 3, delay: '-2s',  dur: '9s'  },
        { top: '62%',  left: '25%',  size: 5, delay: '-4s',  dur: '11s' },
        { top: '75%',  left: '70%',  size: 3, delay: '-6s',  dur: '8s'  },
        { top: '10%',  left: '55%',  size: 4, delay: '-1s',  dur: '10s' },
        { top: '50%',  left: '45%',  size: 3, delay: '-8s',  dur: '13s' },
        { top: '88%',  left: '15%',  size: 4, delay: '-3s',  dur: '6s'  },
        { top: '22%',  left: '78%',  size: 3, delay: '-5s',  dur: '12s' },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-30 dark:opacity-20"
          style={{
            top: dot.top,
            left: dot.left,
            width:  dot.size,
            height: dot.size,
            background: i % 3 === 0
              ? 'rgba(99,102,241,0.8)'
              : i % 3 === 1
              ? 'rgba(168,85,247,0.8)'
              : 'rgba(6,182,212,0.8)',
            animation: `float ${dot.dur} ease-in-out infinite`,
            animationDelay: dot.delay,
          }}
        />
      ))}
    </div>
  )
}
