import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, Sparkles, RotateCcw, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type Flashcard = {
  id: string;
  front: string;
  back: string;
};

const FlashcardModule = () => {
  const [topic, setTopic] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setFlashcards(generateMockFlashcards(topic));
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsLoading(false);
      toast({
        title: "Flashcards Created!",
        description: "Your flashcards are ready for review.",
      });
    }, 2000);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      {flashcards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-card p-6"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-accent" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
              Create Flashcards
            </h2>
            <p className="text-muted-foreground">
              Enter a topic and let AI generate study flashcards for you
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Topic</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Spanish vocabulary, Chemistry elements..."
                className="text-base"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || isLoading}
              variant="hero"
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Generating Flashcards...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Generate Flashcards
                </>
              )}
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {flashcards.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFlashcards([]);
                setTopic("");
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Set
            </Button>
          </div>

          {/* Flashcard */}
          <div className="perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentIndex}-${isFlipped}`}
                initial={{ rotateY: isFlipped ? -180 : 0, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative h-80 cursor-pointer"
              >
                <div className={`absolute inset-0 bg-card rounded-2xl border border-border shadow-card p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                  isFlipped ? "bg-primary/5" : ""
                }`}>
                  <span className={`text-xs font-medium mb-4 px-3 py-1 rounded-full ${
                    isFlipped 
                      ? "bg-accent/10 text-accent" 
                      : "bg-primary/10 text-primary"
                  }`}>
                    {isFlipped ? "Answer" : "Question"}
                  </span>
                  <p className="font-heading text-xl md:text-2xl font-semibold text-foreground">
                    {isFlipped ? currentCard?.back : currentCard?.front}
                  </p>
                  <p className="text-sm text-muted-foreground mt-6">
                    Click to {isFlipped ? "see question" : "reveal answer"}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={prevCard}
              className="w-32"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="hero"
              size="lg"
              onClick={nextCard}
              className="w-32"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Card Indicators */}
          <div className="flex justify-center gap-2 flex-wrap">
            {flashcards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(idx);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-primary scale-125"
                    : "bg-muted hover:bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Mock function - replace with actual AI integration
const generateMockFlashcards = (topic: string): Flashcard[] => {
  return [
    {
      id: "1",
      front: `What is the basic definition of ${topic}?`,
      back: `${topic} refers to the fundamental concepts and principles that form the basis of understanding in this field.`,
    },
    {
      id: "2",
      front: `Name three key components of ${topic}`,
      back: "1. Core principles\n2. Practical applications\n3. Theoretical frameworks",
    },
    {
      id: "3",
      front: `Why is ${topic} important to study?`,
      back: "It provides foundational knowledge that enables deeper understanding and practical application in real-world scenarios.",
    },
    {
      id: "4",
      front: `What are common misconceptions about ${topic}?`,
      back: "Many people think it's purely theoretical, but it has many practical applications in everyday life.",
    },
    {
      id: "5",
      front: `How can you apply ${topic} in practice?`,
      back: "Through hands-on exercises, real-world projects, and connecting concepts to everyday experiences.",
    },
    {
      id: "6",
      front: `What resources help learn ${topic}?`,
      back: "Textbooks, online courses, practice problems, study groups, and educational videos.",
    },
  ];
};

export default FlashcardModule;
