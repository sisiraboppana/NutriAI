import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Camera, BookOpen, HelpCircle, LayoutGrid, LogOut } from "lucide-react";
import appleLogo from "@/assets/apple-logo.png";
import { supabase } from "@/integrations/supabase/client";
import ProfileOnboardingPrompt from "@/components/ProfileOnboardingPrompt";

interface Props {
  title: string;
  children: ReactNode;
  showNav?: boolean;
}

const navItems = [
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/log", icon: Camera, label: "Log" },
  { to: "/menu", icon: LayoutGrid, label: "Menu" },
  { to: "/recipes", icon: BookOpen, label: "Recipes" },
  { to: "/advice", icon: HelpCircle, label: "Advice" },
];

const AppShell = ({ title, children, showNav = true }: Props) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-md w-full">
      <ProfileOnboardingPrompt />

      {/* Header */}
      <header className="pt-6 pb-2 px-5 flex items-center gap-3 relative">
        <img src={appleLogo} alt="NutriAI logo" width={64} height={64} className="w-14 h-14 drop-shadow-lg" />
        <h1 className="wordmark text-5xl leading-none">Nutri AI</h1>
        {showNav && (
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="ml-auto text-white/80 hover:text-white p-2"
          >
            <LogOut size={20} />
          </button>
        )}
      </header>

      {/* Banner */}
      <div className="nutri-banner">
        <h1>{title}</h1>
      </div>

      {/* Content */}
      <main className="flex-1 px-5 py-6">{children}</main>

      {/* Bottom nav */}
      {showNav && (
        <nav className="px-4 pt-2 pb-2 flex items-center justify-around bg-white/10 backdrop-blur-sm">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                  active ? "bg-white text-teal-deep" : "text-white/90 hover:text-white"
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <p className="quote-footer">
        "To eat is a necessity, but to eat intelligently is an art" — La Rochefoucauld
      </p>
    </div>
  );
};

export default AppShell;
