import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import GlobalNav from "@/components/GlobalNav";
import GeminiConcierge from "@/components/GeminiConcierge";
import Home from "./pages/Home";
import Trips from "./pages/Trips";
import Studio from "./pages/Studio";
import Tools from "./pages/Tools";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import SharedTrip from "./pages/SharedTrip";
import Auth from "./pages/Auth";
import DevSandbox from "./pages/DevSandbox";

const queryClient = new QueryClient();

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-sm font-body text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <ProfileProvider>
      <div className="h-screen flex flex-col bg-background">
        <GlobalNav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/shared/:tripId" element={<SharedTrip />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <GeminiConcierge />
      </div>
    </ProfileProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-sm font-body text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthGate />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
