import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, Sparkles, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type Question = {
  id: string;
  type: "mcq" | "short";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type QuizState = "setup" | "active" | "results";

const QuizModule = () => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateQuiz = async () => {
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setQuestions(generateMockQuestions(topic, difficulty));
      setQuizState("active");
      setCurrentIndex(0);
      setAnswers({});
      setIsLoading(false);
      toast({
        title: "Quiz Generated!",
        description: `${5} questions ready for you.`,
      });
    }, 2000);
  };

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setQuizState("results");
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase()) {
        correct++;
      }
    });
    return correct;
  };

  const resetQuiz = () => {
    setQuizState("setup");
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCorrect = currentAnswer?.toLowerCase() === currentQuestion?.correctAnswer.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {quizState === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card rounded-2xl border border-border shadow-card p-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                Generate a Quiz
              </h2>
              <p className="text-muted-foreground">
                Enter a topic and let AI create a personalized quiz for you
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Topic</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., World War II, Photosynthesis, JavaScript..."
                  className="text-base"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                <div className="flex gap-2">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                        difficulty === level
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerateQuiz}
                disabled={!topic.trim() || isLoading}
                variant="hero"
                size="lg"
                className="w-full mt-4"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {quizState === "active" && currentQuestion && (
          <motion.div
            key={`question-${currentIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-card rounded-2xl border border-border shadow-card p-6"
          >
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="capitalize">{difficulty}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-3">
                {currentQuestion.type === "mcq" ? "Multiple Choice" : "Short Answer"}
              </span>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer Options */}
            {currentQuestion.type === "mcq" ? (
              <div className="space-y-2 mb-6">
                {currentQuestion.options?.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => !showExplanation && handleAnswer(option)}
                    disabled={showExplanation}
                    className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all border ${
                      showExplanation
                        ? option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
                          ? "bg-green-500/10 border-green-500 text-green-600"
                          : currentAnswer === option
                          ? "bg-red-500/10 border-red-500 text-red-600"
                          : "bg-muted border-border text-muted-foreground"
                        : currentAnswer === option
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted hover:bg-muted/80 border-border text-foreground"
                    }`}
                  >
                    <span className="mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-6">
                <Input
                  placeholder="Type your answer..."
                  disabled={showExplanation}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !showExplanation) {
                      handleAnswer((e.target as HTMLInputElement).value);
                    }
                  }}
                  className="text-base"
                />
                {!showExplanation && (
                  <p className="text-xs text-muted-foreground mt-2">Press Enter to submit</p>
                )}
              </div>
            )}

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className={`p-4 rounded-xl ${isCorrect ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`font-semibold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{currentQuestion.explanation}</p>
                    {!isCorrect && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Correct answer: <strong>{currentQuestion.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next Button */}
            {showExplanation && (
              <Button onClick={handleNext} variant="hero" className="w-full">
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  "See Results"
                )}
              </Button>
            )}
          </motion.div>
        )}

        {quizState === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border shadow-card p-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <span className="font-heading text-3xl font-bold text-primary">
                {calculateScore()}/{questions.length}
              </span>
            </div>

            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
              Quiz Complete!
            </h2>
            <p className="text-muted-foreground mb-6">
              You scored {calculateScore()} out of {questions.length} questions correctly.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
              <div className="p-4 rounded-xl bg-green-500/10">
                <div className="font-heading text-2xl font-bold text-green-600">{calculateScore()}</div>
                <div className="text-xs text-green-600">Correct</div>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10">
                <div className="font-heading text-2xl font-bold text-red-600">{questions.length - calculateScore()}</div>
                <div className="text-xs text-red-600">Incorrect</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={resetQuiz} variant="outline">
                New Quiz
              </Button>
              <Button onClick={() => { setQuizState("active"); setCurrentIndex(0); setShowExplanation(false); }} variant="hero">
                Review Answers
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Mock function - replace with actual AI integration
const generateMockQuestions = (topic: string, difficulty: string): Question[] => {
  return [
    {
      id: "1",
      type: "mcq",
      question: `What is a fundamental aspect of ${topic}?`,
      options: ["Core principles and foundations", "Random unrelated concepts", "Historical events only", "Mathematical equations"],
      correctAnswer: "Core principles and foundations",
      explanation: `Understanding the core principles is essential for grasping ${topic}. These foundations help build more complex knowledge.`,
    },
    {
      id: "2",
      type: "mcq",
      question: `Which of the following best describes the importance of studying ${topic}?`,
      options: ["It has no practical applications", "It helps understand complex systems", "Only experts need to know it", "It's purely theoretical"],
      correctAnswer: "It helps understand complex systems",
      explanation: `Studying ${topic} helps us understand how complex systems work and interact, leading to practical applications.`,
    },
    {
      id: "3",
      type: "short",
      question: `In one word, what is the primary goal when learning about ${topic}?`,
      correctAnswer: "Understanding",
      explanation: "The primary goal of learning any topic is to develop a deep understanding that can be applied in various contexts.",
    },
    {
      id: "4",
      type: "mcq",
      question: `What approach is most effective for mastering ${topic}?`,
      options: ["Memorization only", "Practice and application", "Avoiding difficult parts", "Speed reading"],
      correctAnswer: "Practice and application",
      explanation: "Practice and application are key to mastering any subject. They help reinforce learning and reveal areas that need more attention.",
    },
    {
      id: "5",
      type: "mcq",
      question: `How does ${topic} relate to real-world scenarios?`,
      options: ["It has no real-world connection", "Direct practical applications exist", "Only in academic settings", "Through abstract theories only"],
      correctAnswer: "Direct practical applications exist",
      explanation: `${topic} has numerous real-world applications that demonstrate its relevance and importance in everyday life.`,
    },
  ];
};

export default QuizModule;
