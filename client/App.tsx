import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

const useHash =
  (typeof window !== "undefined" &&
    window.location.hostname.endsWith("github.io")) ||
  import.meta.env.BASE_URL !== "/";

const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) =>
  useHash ? (
    <HashRouter>{children}</HashRouter>
  ) : (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {children}
    </BrowserRouter>
  );

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterWrapper>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </RouterWrapper>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
