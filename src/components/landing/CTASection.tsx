import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section id="cta" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-secondary" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-secondary-foreground mb-6">
            Ready to Study Smarter, Not Harder?
          </h2>
          <p className="text-lg text-secondary-foreground/70 mb-10 max-w-xl mx-auto">
            Get instant AI explanations, auto-generated quizzes, flashcards, Pomodoro sessions, streaks, and more — all free.
          </p>
          <Link to="/dashboard">
            <Button 
              variant="hero" 
              size="xl"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
