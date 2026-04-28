import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import Landing from "./pages/Landing.tsx";
import Home from "./pages/Home.tsx";
import GroupDashboard from "./pages/GroupDashboard.tsx";
import Personal from "./pages/Personal.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

import { useEffect } from "react";
import { personalStore } from "@/lib/personalStore";
import { store } from "@/lib/store";

const App = () => {
  useEffect(() => {
    store.seedIfEmpty();
    personalStore.seedIfEmpty();
  }, []);
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner position="top-center" richColors theme="system" />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<Home />} />
              <Route path="/personal" element={<Personal />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/group/:id" element={<GroupDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
