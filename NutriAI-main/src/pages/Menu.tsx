import { Link } from "react-router-dom";
import { User, Camera, BookOpen, HelpCircle } from "lucide-react";
import AppShell from "@/components/AppShell";

const tiles = [
  { to: "/profile", label: "User Profile", Icon: User },
  { to: "/log", label: "Log a Meal", Icon: Camera },
  { to: "/recipes", label: "Get Recipes", Icon: BookOpen },
  { to: "/advice", label: "Get Advice", Icon: HelpCircle },
];

const Menu = () => (
  <AppShell title="Menu Page">
    <div className="grid grid-cols-2 gap-5">
      {tiles.map(({ to, label, Icon }) => (
        <Link key={to} to={to} className="nutri-tile">
          <span className="nutri-tile-label">{label}</span>
          <Icon size={56} strokeWidth={1.6} className="text-foreground" />
        </Link>
      ))}
    </div>
  </AppShell>
);

export default Menu;
