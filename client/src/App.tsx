import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Upload from "@/pages/upload";
import AccessPage from "@/pages/access";
import NotFound from "@/pages/not-found";
import Activity from "@/pages/activity";
import Notepad from "@/pages/notepad";
import Settings from "@/pages/settings";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/upload">
        <ProtectedRoute component={Upload} />
      </Route>

      <Route path="/activity">
        <ProtectedRoute component={Activity} />
      </Route>

      <Route path="/notepad">
        <ProtectedRoute component={Notepad} />
      </Route>

      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      {/* Public secure access page - does not require login, but requires code */}
      <Route path="/access/:linkId" component={AccessPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

import { ThemeProvider } from "@/hooks/use-theme";

import { OnboardingTour, OnboardingRestartButton } from "@/components/onboarding-tour";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
          <OnboardingTour />
          <OnboardingRestartButton />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
