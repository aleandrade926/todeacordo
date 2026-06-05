import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navigationItems = [
  { path: "/", label: "Dashboard", icon: "fas fa-home" },
  { path: "/training", label: "Arena de Treino", icon: "fas fa-dumbbell" },
  { path: "/lessons", label: "Lições Teóricas", icon: "fas fa-book-open" },
  { path: "/achievements", label: "Conquistas", icon: "fas fa-trophy" },
  { path: "/leaderboard", label: "Ranking", icon: "fas fa-crown" },
  { path: "/shortcuts", label: "Atalhos", icon: "fas fa-bolt" }
];

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();

  const sidebarContent = (
    <div className="flex flex-col flex-1">
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-slate-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-keyboard text-white text-sm"></i>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-slate-900">Mestre das Teclas</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                location === item.path
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <i className={`${item.icon} w-5 h-5 mr-3`}></i>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="mt-auto p-4 border-t border-slate-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">JD</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-slate-900">João Digitador</p>
            <p className="text-xs text-slate-500">Nível Intermediário</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
            data-testid="sidebar-overlay"
          />
        )}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-slate-200 transform transition-transform lg:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          data-testid="sidebar-mobile"
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div 
      className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white shadow-lg border-r border-slate-200"
      data-testid="sidebar-desktop"
    >
      {sidebarContent}
    </div>
  );
}
