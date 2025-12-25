import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow duration-300">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-xl text-foreground">
                Study<span className="text-primary">Buddy</span>
              </span>
            </Link>
            <Link 
              to="/sign-in" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Already have an account? <span className="text-primary font-medium">Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight">
                  Start Your
                  <span className="block text-primary">Learning Journey</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Join thousands of students who are already using AI to accelerate their learning
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">AI-Powered Explanations</h3>
                    <p className="text-sm text-muted-foreground">Get instant, personalized explanations on any topic</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Smart Quiz Generation</h3>
                    <p className="text-sm text-muted-foreground">Create custom quizzes and track your progress</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Flashcard Creator</h3>
                    <p className="text-sm text-muted-foreground">Automated flashcards with spaced repetition</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Content Summarizer</h3>
                    <p className="text-sm text-muted-foreground">Condense lengthy content into key points</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Sign Up Form */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <div className="glass-card p-8 rounded-2xl shadow-xl">
                  <SignUp 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "bg-transparent shadow-none",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton: "bg-muted hover:bg-muted/80 text-foreground border border-border",
                        dividerLine: "bg-border",
                        dividerText: "text-muted-foreground",
                        formFieldLabel: "text-foreground",
                        formFieldInput: "bg-background border-border focus:border-primary",
                        footerActionLink: "text-primary hover:text-primary/80",
                        identityPreviewText: "text-foreground",
                        identityPreviewEditButton: "text-primary",
                        formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                        footerActionText: "text-muted-foreground",
                      }
                    }}
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    fallbackRedirectUrl="/dashboard"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
