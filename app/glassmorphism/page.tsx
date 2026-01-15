'use client';

import { useMemo, useState } from 'react';

import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassInput,
  GlassStat,
  GlassToggle,
} from '@/components/glassmorphism';

type BillingCycle = 'monthly' | 'annual';

interface PricingTier {
  label: string;
  description: string;
  price: string;
  highlight?: string;
}

const pricingMap: Record<BillingCycle, PricingTier[]> = {
  monthly: [
    {
      label: 'Drift',
      description: 'Launch in hours with orchestration-grade presets.',
      price: '$48',
      highlight: 'Includes guided flows',
    },
    {
      label: 'Vector',
      description: 'Ambient automation for studio-scale teams.',
      price: '$128',
      highlight: 'Priority rendering pipeline',
    },
    {
      label: 'Eclipse',
      description: 'Multi-region glass UI with custom telemetry.',
      price: '$260',
      highlight: 'Dedicated glass runtime',
    },
  ],
  annual: [
    {
      label: 'Drift',
      description: 'Launch in hours with orchestration-grade presets.',
      price: '$480',
      highlight: 'Two months free',
    },
    {
      label: 'Vector',
      description: 'Ambient automation for studio-scale teams.',
      price: '$1280',
      highlight: 'Priority rendering pipeline',
    },
    {
      label: 'Eclipse',
      description: 'Multi-region glass UI with custom telemetry.',
      price: '$2600',
      highlight: 'Dedicated glass runtime',
    },
  ],
};

export default function GlassmorphismShowcase(): JSX.Element {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const tiers = useMemo(() => pricingMap[billingCycle], [billingCycle]);

  return (
    <div className="glass-page relative min-h-screen overflow-hidden bg-slate-950 px-6 py-16 text-white">
      <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.45),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.35),transparent_70%)] blur-[120px]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 h-64 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.12),transparent_70%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-16">
        <header className="glass-fade-in flex flex-col gap-6">
          <GlassBadge tone="electric">premium glass UI</GlassBadge>
          <div className="space-y-4">
            <h1 className="glass-font-display text-5xl leading-tight md:text-6xl">
              Aurora-grade glassmorphism components for signal-rich dashboards.
            </h1>
            <p className="max-w-2xl text-base text-white/70">
              A curated React + TypeScript kit with deep blur, layered borders, and cinematic glow. Built
              to make control rooms feel tactile without sacrificing clarity.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <GlassButton>Request access</GlassButton>
            <GlassButton variant="outline">View docs</GlassButton>
          </div>
        </header>

        <section className="glass-stagger grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <GlassCard
            eyebrow="Signal console"
            title="Ambient control surface"
            description="Compose workflows with adaptive glow and contextual blur."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <GlassStat label="Latency" value="12ms" trend="-18% vs last week" />
              <GlassStat label="Render queue" value="98.2%" trend="+6.2% capacity" />
              <GlassStat label="Glass depth" value="42 layers" trend="Auto-tuned" />
              <GlassStat label="Signal gain" value="1.8x" trend="Peak stability" />
            </div>
          </GlassCard>

          <GlassCard
            eyebrow="Live command"
            title="Launch a session"
            description="Start a new scene with guided safeguards and real-time feedback."
          >
            <div className="space-y-4">
              <GlassInput
                label="Scene name"
                placeholder="Eclipse Command Deck"
                icon={
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M21 12a9 9 0 1 1-6.219-8.56"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m15 3 2.25.75L16.5 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
              <div className="flex flex-wrap gap-3">
                <GlassButton>Deploy module</GlassButton>
                <GlassButton variant="ghost">Preview</GlassButton>
              </div>
              <div className="flex flex-wrap gap-2">
                <GlassBadge tone="cool">enhanced blur</GlassBadge>
                <GlassBadge tone="warm">adaptive glow</GlassBadge>
                <GlassBadge tone="electric">subsurface light</GlassBadge>
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="glass-stagger grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <GlassCard
            eyebrow="Telemetry"
            title="Atmospheric monitoring"
            description="Layered cards isolate the important signals with kinetic depth."
          >
            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">Refraction</span>
                <span className="text-sm text-white">Stable</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">Highlight loss</span>
                <span className="text-sm text-white">0.8%</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">Spectral drift</span>
                <span className="text-sm text-white">Auto-correcting</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            eyebrow="Membership"
            title="Choose your orbit"
            description="Pick a billing cadence and lock the environment."
          >
            <div className="flex flex-col gap-6">
              <GlassToggle
                options={[
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'annual', label: 'Annual' },
                ]}
                selectedId={billingCycle}
                onChange={(value) => setBillingCycle(value as BillingCycle)}
              />
              <div className="grid gap-4">
                {tiers.map((tier) => (
                  <div
                    key={tier.label}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{tier.label}</p>
                        <p className="text-xs text-white/60">{tier.description}</p>
                      </div>
                      <span className="glass-font-display text-2xl text-white">{tier.price}</span>
                    </div>
                    {tier.highlight && <p className="mt-3 text-xs text-white/60">{tier.highlight}</p>}
                  </div>
                ))}
              </div>
              <GlassButton className="w-full">Reserve slot</GlassButton>
            </div>
          </GlassCard>
        </section>

        <footer className="glass-fade-in flex flex-col items-start gap-4 border-t border-white/10 pt-8 text-sm text-white/60">
          <span className="uppercase tracking-[0.3em]">Glassmorphism kit</span>
          <p>Swap tones, blur depth, and glow intensity with a single token update.</p>
        </footer>
      </div>
    </div>
  );
}
