import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Sparkles, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type SummaryType = "bullets" | "keypoints" | "revision";

const SummarizeModule = () => {
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaryType, setSummaryType] = useState<SummaryType>("bullets");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    // Simulate AI response (replace with actual AI call)
    setTimeout(() => {
      setSummary(generateMockSummary(input, summaryType));
      setIsLoading(false);
      toast({
        title: "Summary Generated!",
        description: "Your notes have been summarized successfully.",
      });
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">Input Notes</h3>
            <p className="text-xs text-muted-foreground">Paste your text or upload a file</p>
          </div>
        </div>

        <div className="flex-1 p-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your notes, article, or any text content here...

You can also paste content from PDFs, documents, or any source. The AI will analyze and summarize it for you."
            className="h-full resize-none"
          />
        </div>

        <div className="p-4 border-t border-border space-y-4">
          {/* Summary Type Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Summary Type</label>
            <div className="flex gap-2">
              {([
                { id: "bullets", label: "Bullet Points" },
                { id: "keypoints", label: "Key Points" },
                { id: "revision", label: "Revision Notes" },
              ] as { id: SummaryType; label: string }[]).map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSummaryType(type.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    summaryType === type.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSummarize}
            disabled={!input.trim() || isLoading}
            className="w-full"
            variant="hero"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Output Section */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground">Summary</h3>
              <p className="text-xs text-muted-foreground">AI-generated summary</p>
            </div>
          </div>
          {summary && (
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!summary && !isLoading && (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">
                  No Summary Yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Paste your notes on the left and click "Generate Summary" to get started.
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Analyzing and summarizing...</p>
              </div>
            </div>
          )}

          {summary && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-sm max-w-none"
            >
              <div className="text-sm text-foreground whitespace-pre-wrap">{summary}</div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// Mock function - replace with actual AI integration
const generateMockSummary = (text: string, type: SummaryType): string => {
  const wordCount = text.split(/\s+/).length;
  
  const summaries: Record<SummaryType, string> = {
    bullets: `📋 **Bullet Point Summary**

• The main topic discusses key concepts and their relationships
• Important factors include understanding the foundational elements
• There are multiple interconnected components that work together
• Practical applications can be derived from this understanding
• The conclusion emphasizes the importance of comprehensive knowledge

📊 **Statistics:**
- Original length: ${wordCount} words
- Summary: 5 key bullet points
- Compression ratio: ~80%`,

    keypoints: `🎯 **Key Points Extraction**

**Main Idea:**
The text focuses on explaining important concepts and their practical applications.

**Supporting Points:**
1. **First Key Concept** - Foundational understanding is essential
2. **Second Key Concept** - Interconnected elements create complex systems
3. **Third Key Concept** - Practical applications enhance learning

**Critical Insights:**
- Understanding relationships between concepts is crucial
- Application of knowledge leads to deeper comprehension

📊 Original: ${wordCount} words → Summary: Key points extracted`,

    revision: `📚 **One-Page Revision Notes**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**TOPIC OVERVIEW**
This content covers fundamental concepts essential for understanding the subject matter.

**REMEMBER THESE:**
✓ Core principle #1: Understanding basics
✓ Core principle #2: Connecting concepts
✓ Core principle #3: Practical application

**KEY DEFINITIONS:**
• Term A: Essential foundation
• Term B: Building blocks
• Term C: Application layer

**QUICK REVIEW QUESTIONS:**
1. What are the main components?
2. How do they interact?
3. What are practical uses?

**EXAM TIPS:**
⭐ Focus on relationships between concepts
⭐ Remember practical examples
⭐ Review key definitions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Condensed from ${wordCount} words`,
  };

  return summaries[type];
};

export default SummarizeModule;
