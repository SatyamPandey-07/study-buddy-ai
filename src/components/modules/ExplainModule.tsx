import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, RotateCcw, User, Bot, History, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { explainAPI } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DifficultyLevel = "simple" | "medium" | "advanced";

type Conversation = {
  id: string;
  title: string;
  difficulty: string;
  updatedAt: string;
};

const ExplainModule = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("simple");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load conversation history
  useEffect(() => {
    if (showHistory) {
      loadConversationHistory();
    }
  }, [showHistory]);

  const loadConversationHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await explainAPI.getHistory();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Failed to load conversation history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await explainAPI.getConversation(id);
      const conversation = response.conversation;
      
      setConversationId(conversation.id);
      setDifficulty(conversation.difficulty as DifficultyLevel);
      
      const loadedMessages: Message[] = conversation.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      
      setMessages(loadedMessages);
      setShowHistory(false);
      toast.success("Conversation loaded");
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

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

    try {
      const response = await explainAPI.sendMessage(
        input,
        difficulty,
        conversationId || undefined
      );

      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.assistantMessage?.content || response.response || "I couldn't generate a response.",
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting explanation:", error);
      toast.error("Failed to get explanation. Please try again.");
      
      // Remove the user message if the request failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
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
          <div className="flex gap-2">
            <Button 
              variant={showHistory ? "secondary" : "ghost"} 
              size="icon" 
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={clearChat}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
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

      {/* Conversation History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 top-20 w-80 max-h-[calc(100vh-120px)] bg-card rounded-2xl border border-border shadow-lg p-4 z-50 lg:relative lg:top-0 lg:right-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h4 className="font-heading font-semibold text-foreground">Chat History</h4>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="lg:hidden">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="h-[500px]">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all hover:bg-muted ${
                        conversationId === conv.id ? "bg-muted border border-primary" : "bg-card border border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate flex-1">
                          {conv.title}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          conv.difficulty === "simple" ? "bg-green-500/10 text-green-500" :
                          conv.difficulty === "medium" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          {conv.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.createdAt).toLocaleDateString()} • {conv.messageCount} messages
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

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

export default ExplainModule;
