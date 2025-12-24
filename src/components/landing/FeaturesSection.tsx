import { motion } from "framer-motion";
import { Brain, FileText, HelpCircle, Layers, Clock, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Concept Explanation",
    description: "Get complex topics explained in simple, medium, or advanced levels with real-world analogies.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: FileText,
    title: "Smart Summarization",
    description: "Upload notes or PDFs and get bullet summaries, key points, and one-page revision notes.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: HelpCircle,
    title: "Quiz Generator",
    description: "Auto-generate MCQs and short-answer quizzes from any topic with instant grading.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Layers,
    title: "Flashcard Creator",
    description: "Create and review AI-generated flashcards with spaced repetition for better retention.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Clock,
    title: "Learning History",
    description: "Track your progress, revisit past sessions, and build on your knowledge over time.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Ethical AI",
    description: "Responses are carefully validated to avoid hallucinations and ensure accuracy.",
    color: "bg-accent/10 text-accent",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need to
            <span className="gradient-text"> Learn Smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful AI tools designed to help you understand, retain, and excel in your studies.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="h-full p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
