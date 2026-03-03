import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Menu, X, LogOut, BarChart3, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useClerk, UserButton } from "@clerk/clerk-react";
import PomodoroTimer from "@/components/PomodoroTimer";
import { useActiveModule } from "@/lib/activeModule";
import { adminAPI } from "@/lib/api";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { activeModule } = useActiveModule();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSignedIn) { setIsAdmin(false); return; }
    adminAPI.check().then(() => setIsAdmin(true)).catch(() => setIsAdmin(false));
  }, [isSignedIn]);

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow duration-300">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              Study<span className="text-primary">Buddy</span>
            </span>
          </Link>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <>
                <PomodoroTimer module={activeModule} />
                <Link to="/dashboard/stats">
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Stats
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9",
                      userButtonPopoverCard: "shadow-xl"
                    }
                  }}
                />
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/sign-up">
                <Button variant="hero" size="sm">
                  Get Started
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              <div className="pt-4 space-y-2">
                {isSignedIn ? (
                  <>
                    <div className="flex justify-center pb-2">
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: "w-12 h-12",
                            userButtonPopoverCard: "shadow-xl"
                          }
                        }}
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/sign-up" className="block">
                    <Button variant="hero" className="w-full justify-center">
                      Get Started
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
