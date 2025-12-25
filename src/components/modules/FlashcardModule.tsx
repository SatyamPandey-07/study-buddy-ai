import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, Sparkles, RotateCcw, ArrowLeft, ArrowRight, Plus, History, Clock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { flashcardAPI } from "@/lib/api";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  mastered?: boolean;
};

type FlashcardSet = {
  id: string;
  topic: string;
  cardCount: number;
  masteredCount: number;
  createdAt: string;
};

const FlashcardModule = () => {
  const [topic, setTopic] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadFlashcardSets();
  }, []);

  const loadFlashcardSets = async () => {
    try {
      setLoadingHistory(true);
      const data = await flashcardAPI.getSets();
      setFlashcardSets(data.sets || []);
    } catch (error) {
      console.error('Failed to load flashcard sets:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSet = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await flashcardAPI.getSet(id);
      setCurrentSetId(data.set.id);
      setTopic(data.set.topic);
      setFlashcards(data.set.flashcards.map((f: any) => ({
        id: f.id,
        front: f.front,
        back: f.back,
        mastered: f.mastered,
      })));
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHistory(false);
    } catch (error) {
      toast.error("Failed to load flashcard set. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await flashcardAPI.deleteSet(id);
      setFlashcardSets(prev => prev.filter(s => s.id !== id));
      toast.success("Flashcard set deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete flashcard set.");
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const data = await flashcardAPI.generateFlashcards(topic, 6);
      setCurrentSetId(data.set.id);
      setFlashcards(data.set.flashcards.map((f: any) => ({
        id: f.id,
        front: f.front,
        back: f.back,
        mastered: f.mastered,
      })));
      setCurrentIndex(0);
      setIsFlipped(false);
      toast.success(`Flashcards Created! ${data.set.flashcards.length} flashcards ready for review.`);
      loadFlashcardSets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to generate flashcards. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMastered = async () => {
    const currentCard = flashcards[currentIndex];
    if (!currentCard) return;

    try {
      const newMastered = !currentCard.mastered;
      await flashcardAPI.updateCard(currentCard.id, newMastered);
      setFlashcards(prev => prev.map(f => 
        f.id === currentCard.id ? { ...f, mastered: newMastered } : f
      ));
      toast.success(newMastered ? "Marked as Mastered! Great job!" : "Card unmarked for more practice.");
    } catch (error) {
      console.error('Failed to update card:', error);
    }
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
    <div className="flex gap-6">
      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 280 }}
            exit={{ opacity: 0, x: -20, width: 0 }}
            className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex-shrink-0"
          >
            <div className="p-4 border-b border-border">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <History className="w-4 h-4" />
                Flashcard Sets
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {loadingHistory ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Loading...
                </div>
              ) : flashcardSets.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No flashcard sets yet
                </div>
              ) : (
                flashcardSets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => loadSet(set.id)}
                    className="w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-medium text-sm text-foreground truncate flex-1">
                        {set.topic}
                      </div>
                      <button
                        onClick={(e) => deleteSet(set.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{set.cardCount} cards</span>
                      <span>•</span>
                      <span className="text-green-500">{set.masteredCount} mastered</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(set.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 max-w-2xl mx-auto">
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

          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              {showHistory ? "Hide History" : "Show History"}
            </Button>
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
                setCurrentSetId(null);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Set
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              History
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
                } ${currentCard?.mastered ? "ring-2 ring-green-500" : ""}`}>
                  {currentCard?.mastered && (
                    <span className="absolute top-4 right-4 text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                      ✓ Mastered
                    </span>
                  )}
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
              variant={currentCard?.mastered ? "secondary" : "outline"}
              size="lg"
              onClick={toggleMastered}
              className="w-32"
            >
              {currentCard?.mastered ? "✓ Mastered" : "Mark Done"}
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
            {flashcards.map((card, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(idx);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-primary scale-125"
                    : card.mastered
                    ? "bg-green-500"
                    : "bg-muted hover:bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FlashcardModule;
