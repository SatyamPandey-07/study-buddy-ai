import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import { useActiveModule } from "@/lib/activeModule";
import { Brain, FileText, HelpCircle, Layers, FolderOpen } from "lucide-react";
import ExplainModule from "@/components/modules/ExplainModule";
import SummarizeModule from "@/components/modules/SummarizeModule";
import QuizModule from "@/components/modules/QuizModule";
import FlashcardModule from "@/components/modules/FlashcardModule";
import ResourceModule from "@/components/modules/ResourceModule";

const tabs = [
  { id: "explain", label: "Explain", icon: Brain, description: "Get AI explanations" },
  { id: "summarize", label: "Summarize", icon: FileText, description: "Summarize notes" },
  { id: "quiz", label: "Quiz", icon: HelpCircle, description: "Generate quizzes" },
  { id: "flashcards", label: "Flashcards", icon: Layers, description: "Create flashcards" },
  { id: "resources", label: "Resources", icon: FolderOpen, description: "Manage materials" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("explain");
  const { setActiveModule } = useActiveModule();

  useEffect(() => {
    setActiveModule(activeTab);
  }, [activeTab, setActiveModule]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Study Dashboard
            </h1>
            <p className="text-muted-foreground">
              Choose a study mode and start learning with AI
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "explain" && <ExplainModule />}
              {activeTab === "summarize" && <SummarizeModule />}
              {activeTab === "quiz" && <QuizModule />}
              {activeTab === "flashcards" && <FlashcardModule />}
              {activeTab === "resources" && <ResourceModule />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
