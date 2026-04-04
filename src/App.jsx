import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import HabitsList from "@/pages/habits";
import HabitDetail from "@/pages/habits/detail";
import Analytics from "@/pages/analytics";
import Login from "@/pages/Login";
import { useUser } from "@/hooks/use-auth";

// Centralized Query Client config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function Router() {
  const { data: user, isLoading: checkingAuth } = useUser();
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={checkingAuth ? (() => <div />) : (user ? Dashboard : Login)} />
      <Route path="/habits" component={checkingAuth ? (() => <div />) : (user ? HabitsList : Login)} />
      <Route path="/habits/:id" component={checkingAuth ? (() => <div />) : (user ? HabitDetail : Login)} />
      <Route path="/analytics" component={checkingAuth ? (() => <div />) : (user ? Analytics : Login)} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
