import { useState } from "react";
import { useLocation } from "wouter";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { label: "Home",        href: "/" },
  { label: "Markets",     href: "/markets" },
  { label: "Commodities", href: "/commodities" },
  { label: "Vendor",      href: "/vendor" },
];

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">OjaAlert</span>
          </button>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = location === href;
              return (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Auth + mobile toggle */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-slate-600 truncate max-w-[140px]">
                  {user?.user_metadata?.name || user?.email || "Account"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="hidden md:flex bg-blue-600 hover:bg-blue-700"
                onClick={() => setAuthOpen(true)}
              >
                Sign In
              </Button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = location === href;
              return (
                <button
                  key={href}
                  onClick={() => { navigate(href); setMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => { setAuthOpen(true); setMenuOpen(false); }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}