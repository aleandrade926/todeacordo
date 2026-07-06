import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster.tsx";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import Dashboard from "./pages/dashboard";
import Training from "./pages/training";
import Lessons from "./pages/lessons";
import Achievements from "./pages/achievements";
import Leaderboard from "./pages/leaderboard";
import Shortcuts from "./pages/shortcuts";
import AuthPage from "./pages/auth-page";
import InfraPage from "./pages/infra";
import TaxManagers from "./pages/taxmanagers";
import TaxManagersPrivacy from "./pages/taxmanagers-privacy";
import TaxManagersApp from "./pages/taxmanagers-app";
import Sidebar from "./components/sidebar";
import { useIsMobile } from "./hooks/use-mobile";
import { useState } from "react";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/training" component={Training} />
      <ProtectedRoute path="/lessons" component={Lessons} />
      <ProtectedRoute path="/achievements" component={Achievements} />
      <ProtectedRoute path="/leaderboard" component={Leaderboard} />
      <ProtectedRoute path="/shortcuts" component={Shortcuts} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rota independente da TailorSpace Infra
  if (location === "/infra") {
    return <InfraPage />;
  }

  // Rota independente Tax Managers
  if (location === "/taxmanagers") {
    return <TaxManagers />;
  }

  // Rota independente Tax Managers Privacidade
  if (location === "/taxmanagers/politica-de-privacidade" || location === "/taxmanagers/privacidade") {
    return <TaxManagersPrivacy />;
  }

  // Rota independente Tax Managers App Portal
  if (location === "/" || location.startsWith("/app") || location.startsWith("/taxmanagers/app")) {
    return <TaxManagersApp />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />
          
          <div className="flex-1 lg:pl-64">
            {isMobile && (
              <div className="lg:hidden bg-white shadow-sm border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button 
                      onClick={() => setSidebarOpen(true)}
                      className="text-slate-500 hover:text-slate-700"
                      data-testid="button-open-sidebar"
                    >
                      <i className="fas fa-bars text-xl"></i>
                    </button>
                    <h1 className="ml-3 text-lg font-bold text-slate-900">Mestre das Teclas</h1>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JD</span>
                  </div>
                </div>
              </div>
            )}
            
            <main className="p-6">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
