import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, Sparkles, CheckCircle2, XCircle, ArrowRight, History, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { quizAPI } from "@/lib/api";

type Question = {
  id: string;
  type: "mcq" | "short";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type QuizState = "setup" | "active" | "results";

type QuizHistory = {
  id: string;
  topic: string;
  difficulty: string;
  score: number | null;
  totalQuestions: number;
  createdAt: string;
};

const QuizModule = () => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadQuizHistory();
  }, []);

  const loadQuizHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await quizAPI.getHistory();
      setQuizHistory(data.quizzes || []);
    } catch (error) {
      console.error('Failed to load quiz history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadQuiz = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await quizAPI.getQuiz(id);
      setQuizId(data.quiz.id);
      setTopic(data.quiz.topic);
      setDifficulty(data.quiz.difficulty);
      setQuestions(data.quiz.questions.map((q: any) => ({
        id: q.id,
        type: q.type?.toLowerCase() === 'mcq' ? 'mcq' : 'short',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })));
      setQuizState("active");
      setCurrentIndex(0);
      setAnswers({});
      setShowExplanation(false);
      setShowHistory(false);
    } catch (error) {
      toast.error("Failed to load quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await quizAPI.deleteQuiz(id);
      setQuizHistory(prev => prev.filter(q => q.id !== id));
      toast.success("Quiz deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete quiz.");
    }
  };

  const handleGenerateQuiz = async () => {
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const data = await quizAPI.generateQuiz(topic, difficulty, 5);
      setQuizId(data.quiz.id);
      setQuestions(data.quiz.questions.map((q: any) => ({
        id: q.id,
        type: q.type?.toLowerCase() === 'mcq' ? 'mcq' : 'short',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })));
      setQuizState("active");
      setCurrentIndex(0);
      setAnswers({});
      toast.success(`Quiz Generated! ${data.quiz.questions.length} questions ready for you.`);
      loadQuizHistory();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error;
      const displayMessage = typeof errorMessage === 'string'
        ? errorMessage
        : (errorMessage?.message || "Failed to generate quiz. Please try again.");
      toast.error(displayMessage);
    } finally {
      setIsLoading(false);
    }
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
      submitQuizScore();
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
    setQuizId(null);
  };

  const submitQuizScore = async () => {
    if (quizId) {
      try {
        await quizAPI.submitQuiz(quizId, answers);
        loadQuizHistory();
      } catch (error) {
        console.error('Failed to submit quiz score:', error);
      }
    }
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCorrect = currentAnswer?.toLowerCase() === currentQuestion?.correctAnswer.toLowerCase();

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
                Quiz History
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {loadingHistory ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Loading...
                </div>
              ) : quizHistory.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No quizzes yet
                </div>
              ) : (
                quizHistory.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="relative group"
                  >
                    <button
                      onClick={() => loadQuiz(quiz.id)}
                      className="w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50"
                    >
                      <div className="font-medium text-sm text-foreground truncate pr-8">
                        {quiz.topic}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="capitalize">{quiz.difficulty}</span>
                        {quiz.score !== null && (
                          <>
                            <span>•</span>
                            <span className={quiz.score >= quiz.totalQuestions / 2 ? "text-green-500" : "text-red-500"}>
                              {quiz.score}/{quiz.totalQuestions}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={(e) => deleteQuiz(quiz.id, e)}
                      className="absolute right-2 top-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 max-w-3xl mx-auto">
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
                        className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all ${difficulty === level
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
                      className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all border ${showExplanation
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
    </div>
  );
};

export default QuizModule;
