import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import Cover from "./pages/Cover.tsx";
import Login from "./pages/Login.tsx";
import Home from "./pages/Home.tsx";
import GroupDashboard from "./pages/GroupDashboard.tsx";
import Personal from "./pages/Personal.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        // Seed name from auth metadata if store still has default
        const current = store.getMeName();
        if (current === "You" || current === "") {
          const authName =
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "You";
          store.setMeName(authName);
        }
      }
      window.dispatchEvent(new CustomEvent("splitsmart:change"));
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner position="top-center" richColors theme="system" />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Cover />} />
              <Route path="/login" element={<Login />} />
              <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/personal" element={<ProtectedRoute><Personal /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/group/:id" element={<ProtectedRoute><GroupDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
