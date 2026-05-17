import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import StudentDashboard from "@/pages/student-dashboard";
import DriverPortal from "@/pages/driver-portal";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import collegeLogo from "@assets/WhatsApp Image 2025-09-16 at 21.31.33_e3c0b773_1758038648791.jpg";

function AppHeader({ currentView, setCurrentView }: { currentView: string; setCurrentView: (view: 'student' | 'driver') => void }) {
  return (
    <header className="bg-white shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
              <img 
                src={collegeLogo} 
                alt="AIT College Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'w-12 h-12 bg-secondary rounded-full flex items-center justify-center';
                  fallback.innerHTML = '<i class="fas fa-graduation-cap text-white text-xl"></i>';
                  e.currentTarget.parentElement?.appendChild(fallback);
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">AIT Bus Tracking</h1>
              <p className="text-sm text-muted-foreground">Adichunchanagiri Institute of Technology</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant={currentView === 'student' ? 'outline' : 'default'}
              onClick={() => setCurrentView('student')}
              data-testid="button-student-mode"
            >
              <i className="fas fa-user-graduate mr-2"></i>Student View
            </Button>
            <Button
              variant={currentView === 'driver' ? 'outline' : 'default'}
              onClick={() => setCurrentView('driver')}
              data-testid="button-driver-mode"
            >
              <i className="fas fa-bus mr-2"></i>Driver Portal
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Router() {
  const [currentView, setCurrentView] = useState<'student' | 'driver'>('student');

  return (
    <div className="min-h-screen">
      <AppHeader currentView={currentView} setCurrentView={setCurrentView} />
      <div className="h-[calc(100vh-4rem)]">
        {currentView === 'student' ? <StudentDashboard /> : <DriverPortal />}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
