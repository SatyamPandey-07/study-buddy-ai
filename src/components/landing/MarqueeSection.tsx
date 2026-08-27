import { Sparkles, Zap, Database, Shield, Cpu, Cloud } from "lucide-react";

const stack = [
  { label: "Groq LPU Inference", icon: Zap },
  { label: "Clerk Auth", icon: Shield },
  { label: "Prisma ORM", icon: Database },
  { label: "Neon Postgres", icon: Cloud },
  { label: "React 18", icon: Cpu },
  { label: "AI-Powered", icon: Sparkles },
];

const MarqueeSection = () => {
  const items = [...stack, ...stack];

  return (
    <section className="relative py-10 border-y border-border/50 bg-background overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-8 text-muted-foreground shrink-0"
          >
            <item.icon className="w-4 h-4 text-primary/70" />
            <span className="font-heading text-sm font-medium whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MarqueeSection;
