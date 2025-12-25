import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Sparkles, Copy, Check, History, Clock, Trash2, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { summarizeAPI, uploadAPI } from "@/lib/api";

type SummaryType = "bullets" | "keypoints" | "revision";

type SummaryHistory = {
  id: string;
  title: string;
  sourceType: string;
  createdAt: string;
};

const SummarizeModule = () => {
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaryType, setSummaryType] = useState<SummaryType>("bullets");
  const [copied, setCopied] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState<SummaryHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSummaryHistory();
  }, []);

  const loadSummaryHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await summarizeAPI.getHistory();
      setSummaryHistory(data.summaries || []);
    } catch (error) {
      console.error('Failed to load summary history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSummary = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await summarizeAPI.getSummary(id);
      setCurrentId(data.id);
      setInput(data.originalContent);
      setSummary(data.summary);
      setShowHistory(false);
    } catch (error) {
      toast.error("Failed to load summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSummary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await summarizeAPI.deleteSummary(id);
      setSummaryHistory(prev => prev.filter(s => s.id !== id));
      toast.success("Summary deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete summary.");
    }
  };

  const handleSummarize = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const title = input.substring(0, 50).trim() + (input.length > 50 ? '...' : '');
      const data = await summarizeAPI.createSummary(input, title, summaryType);
      setCurrentId(data.summary.id);
      setSummary(data.summary.summary);
      toast.success("Summary Generated! Your notes have been summarized successfully.");
      loadSummaryHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB.");
      return;
    }

    setUploadingFile(true);
    try {
      const data = await uploadAPI.extractPDF(file);
      setInput(data.totalText);
      toast.success(`PDF uploaded! Extracted ${data.totalPages} pages.`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to upload PDF. Please try again.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
                Summary History
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {loadingHistory ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Loading...
                </div>
              ) : summaryHistory.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No summaries yet
                </div>
              ) : (
                summaryHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadSummary(item.id)}
                    className="w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-medium text-sm text-foreground truncate flex-1">
                        {item.title}
                      </div>
                      <button
                        onClick={(e) => deleteSummary(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{item.sourceType}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 grid lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground">Input Notes</h3>
            <p className="text-xs text-muted-foreground">Paste your text or upload a PDF</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile || isLoading}
            >
              <File className="w-4 h-4 mr-2" />
              {uploadingFile ? "Uploading..." : "Upload PDF"}
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
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
    </div>
  );
};

export default SummarizeModule;
