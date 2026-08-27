import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, BookOpen, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { EASE_OUT as EASE } from "@/lib/utils";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient mesh */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-mesh-drift" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-mesh-drift"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-72 h-72 bg-amber-glow/10 rounded-full blur-3xl animate-mesh-drift"
          style={{ animationDelay: "8s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Floating Icons */}
      <motion.div
        className="absolute top-32 left-[10%] text-primary/30"
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Brain className="w-16 h-16" />
      </motion.div>
      <motion.div
        className="absolute top-48 right-[15%] text-accent/30"
        animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <Lightbulb className="w-12 h-12" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-[20%] text-primary/20"
        animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <BookOpen className="w-14 h-14" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.2, rotate: -50 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.28, ease: EASE }}
              className="inline-flex"
            >
              <Sparkles className="w-4 h-4" />
            </motion.span>
            <span>AI-Powered Learning — 10 Features, Zero Compromise</span>
          </motion.div>

          {/* Headline — masked line reveal */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
            <span className="block overflow-hidden py-1">
              <motion.span
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.14, ease: EASE }}
                className="block"
              >
                Your Personal
              </motion.span>
            </span>
            <span className="block overflow-hidden py-1">
              <motion.span
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.32, ease: EASE }}
                className="gradient-text block"
              >
                AI Study Companion
              </motion.span>
            </span>
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance"
          >
            Transform the way you learn with AI that explains concepts, summarizes notes, generates quizzes, and creates flashcards — plus Pomodoro sessions, streak tracking, a resource library, analytics, gamification, and an admin panel.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.62, ease: EASE }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard">
              <Button variant="hero" size="xl">
                Start Learning Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="glass" size="xl">
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.74, ease: EASE }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto"
          >
            {[
              { value: "10+", label: "AI Features" },
              { value: "4", label: "Study Modules" },
              { value: "100%", label: "Free to Use" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
