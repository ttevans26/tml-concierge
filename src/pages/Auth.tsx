import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

type DbStatus = "checking" | "connected" | "missing-keys" | "network-error";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatus>("checking");
  const { toast } = useToast();

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setDbStatus("missing-keys");
      return;
    }
    supabase.auth.getSession()
      .then(({ error }) => {
        setDbStatus(error ? "network-error" : "connected");
        if (error) console.error("[Auth Diagnostic] getSession error:", error.message);
      })
      .catch((err) => {
        setDbStatus("network-error");
        console.error("[Auth Diagnostic] getSession exception:", err);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) {
          toast({
            title: `Sign Up Error (${error.status ?? "unknown"})`,
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        if (data.session) {
          toast({ title: "Welcome!", description: "Account created successfully." });
        } else {
          toast({
            title: "Account created",
            description: "Please check your email to confirm your account.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({
            title: `Login Error (${error.status ?? "unknown"})`,
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }
    } catch (err: any) {
      toast({
        title: "Unexpected Error",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<DbStatus, string> = {
    checking: "text-muted-foreground",
    connected: "text-forest",
    "missing-keys": "text-destructive",
    "network-error": "text-destructive",
  };
  const statusLabel: Record<DbStatus, string> = {
    checking: "Checking…",
    connected: "Connected",
    "missing-keys": "Missing Keys",
    "network-error": "Network Error",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block bg-forest text-primary-foreground px-4 py-2 rounded-md mb-4">
            <h1 className="font-display text-xl font-bold tracking-tight">TML Concierge</h1>
          </div>
          <p className="text-sm font-body text-muted-foreground">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <Input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 font-body"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 font-body"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-10 font-body"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-primary-foreground hover:opacity-90 font-body"
          >
            {loading ? "Loading…" : isSignUp ? "Create Account" : "Sign In"}
            <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
          </Button>
        </form>

        <p className="text-center text-sm font-body text-muted-foreground mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-forest font-medium hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>

        {/* DB Status Diagnostic */}
        <p className={`text-center text-[10px] font-mono mt-8 ${statusColor[dbStatus]}`}>
          DB Status: {statusLabel[dbStatus]}
        </p>
      </div>
    </div>
  );
}
