import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Menu, X, LogOut, BarChart3, ShieldCheck } from "lucide-react";
import { useState, useEffect, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useClerk, UserButton } from "@clerk/clerk-react";
import PomodoroTimer from "@/components/PomodoroTimer";
import { useActiveModule } from "@/lib/activeModule";
import { adminAPI } from "@/lib/api";
import { EASE_OUT } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", hash: "#features" },
  { label: "Get Started", hash: "#cta" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { activeModule } = useActiveModule();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isSignedIn) { setIsAdmin(false); return; }
    adminAPI.check().then(() => setIsAdmin(true)).catch(() => setIsAdmin(false));
  }, [isSignedIn]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = () => {
    signOut();
  };

  const handleAnchorClick = (hash: string) => (e: MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-card"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group md:justify-self-start">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow duration-300">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              Study<span className="text-primary">Buddy</span>
            </span>
          </Link>

          {/* Center nav pills — landing page only */}
          {isLandingPage && (
            <nav className="hidden md:flex items-center gap-2 md:justify-self-center">
              {NAV_LINKS.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.hash}
                  onClick={handleAnchorClick(item.hash)}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease: EASE_OUT }}
                  className="group relative inline-flex items-center justify-center h-9 px-4 rounded-full border border-border bg-card/60 backdrop-blur-sm text-sm font-medium text-foreground/75 overflow-hidden isolate transition-colors duration-300 hover:text-foreground hover:border-primary/40 hover:shadow-glow before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent before:-translate-x-[130%] before:transition-transform before:duration-500 before:ease-out hover:before:translate-x-[130%]"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
          )}

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3 md:justify-self-end">
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
              {isLandingPage && (
                <div className="space-y-2 pb-2">
                  {NAV_LINKS.map((item) => (
                    <a
                      key={item.label}
                      href={item.hash}
                      onClick={handleAnchorClick(item.hash)}
                      className="block w-full text-center py-3 rounded-lg border border-border bg-card/60 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 transition-colors duration-300"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
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
