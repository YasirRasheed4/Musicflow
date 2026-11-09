import { NavLink } from "react-router-dom";
import { Home, Compass, Library, Settings } from "lucide-react";

export default function MobileNav() {
  const linkClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
      isActive ? "text-accent" : "text-muted hover:text-ink"
    }`;

  return (
    <nav className="flex border-t border-line bg-surface/90 backdrop-blur-xl md:hidden z-30">
      <NavLink to="/" end className={linkClass}>
        <Home size={18} />
        Home
      </NavLink>
      <NavLink to="/search" className={linkClass}>
        <Compass size={18} />
        Search
      </NavLink>
      <NavLink to="/library" className={linkClass}>
        <Library size={18} />
        Library
      </NavLink>
      <NavLink to="/settings" className={linkClass}>
        <Settings size={18} />
        Settings
      </NavLink>
    </nav>
  );
}
