import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, RotateCcw, User, Bot } from "lucide-react";
import { motion } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DifficultyLevel = "simple" | "medium" | "advanced";

const ExplainModule = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("simple");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (replace with actual AI call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockExplanation(input, difficulty),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="grid lg:grid-cols-[1fr,320px] gap-6">
      {/* Main Chat Area */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground">AI Explainer</h3>
              <p className="text-xs text-muted-foreground">Ask any concept</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">
                  Ready to Learn?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ask me to explain any concept. I'll break it down based on your selected difficulty level.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                message.role === "user" 
                  ? "bg-secondary text-secondary-foreground" 
                  : "bg-primary/10 text-primary"
              }`}>
                {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                message.role === "user"
                  ? "bg-secondary text-secondary-foreground rounded-tr-md"
                  : "bg-muted text-foreground rounded-tl-md"
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-2xl rounded-tl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to explain any concept..."
              className="min-h-[52px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="shrink-0 h-[52px] w-[52px]">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Settings Panel */}
      <div className="space-y-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
          <h4 className="font-heading font-semibold text-foreground mb-4">Difficulty Level</h4>
          <div className="space-y-2">
            {(["simple", "medium", "advanced"] as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-all ${
                  difficulty === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                <span className="capitalize">{level}</span>
                <p className={`text-xs mt-0.5 ${difficulty === level ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {level === "simple" && "ELI5 style with analogies"}
                  {level === "medium" && "Balanced explanation"}
                  {level === "advanced" && "Technical details"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
          <h4 className="font-heading font-semibold text-foreground mb-3">Quick Prompts</h4>
          <div className="space-y-2">
            {[
              "Explain photosynthesis",
              "What is machine learning?",
              "How do vaccines work?",
              "Explain quantum physics",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="w-full p-2 rounded-lg text-left text-sm bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock function - replace with actual AI integration
const generateMockExplanation = (topic: string, difficulty: DifficultyLevel): string => {
  const explanations: Record<DifficultyLevel, string> = {
    simple: `Great question about "${topic}"! 

Let me explain this in simple terms:

Think of it like this - imagine you're building with LEGO blocks. ${topic} works similarly, where different pieces come together to create something amazing.

🎯 The main idea: It's basically about understanding how things connect and work together.

💡 Real-world example: Just like how your phone needs a battery to work, ${topic} needs its own "power source" to function properly.

Would you like me to explain any part in more detail?`,
    
    medium: `Here's a balanced explanation of "${topic}":

**Overview:**
${topic} is a fundamental concept that involves understanding the relationship between various components and their interactions.

**Key Points:**
1. It operates on specific principles that govern its behavior
2. There are multiple factors that influence how it works
3. Understanding the basics helps grasp more complex aspects

**How it works:**
The process involves several steps where each component plays a crucial role in the overall system.

**Practical Application:**
This concept is widely used in everyday life, from technology to natural phenomena.

Need me to dive deeper into any specific aspect?`,
    
    advanced: `**In-depth Analysis of "${topic}":**

**Theoretical Framework:**
${topic} operates within a complex theoretical framework that encompasses multiple interconnected systems. The underlying mechanisms involve sophisticated processes that require comprehensive understanding of foundational principles.

**Technical Details:**
- Mechanism A: Operates through specific pathways with defined parameters
- Mechanism B: Involves quantitative relationships and measurable outcomes
- Mechanism C: Demonstrates emergent properties under specific conditions

**Current Research:**
Recent studies have expanded our understanding, revealing nuanced interactions and potential applications in advanced fields.

**Implications:**
The implications of this understanding extend to various domains, including practical applications and theoretical advancements.

Would you like me to elaborate on any technical aspect or provide references?`,
  };

  return explanations[difficulty];
};

export default ExplainModule;
