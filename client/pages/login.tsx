import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Key, User, ArrowRight, Zap, Lock, Sparkles, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function Login() {
  const { login, isLoggingIn, isOnline } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  // Block login if offline
  const isDisabled = isLoggingIn || !isOnline;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Client-side validation
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    try {
      await login({ username, password });
      setAttempts(0);
    } catch (err: any) {
      setAttempts(prev => prev + 1);
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Enhanced ambient background - mesh gradient + grid */}
      <div className="absolute inset-0 bg-mesh bg-grid pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-primary/20 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-accent/15 blur-[120px] rounded-full animate-pulse decoration-3000" style={{ animationDuration: '5s' }} />
        <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] bg-secondary/10 blur-[80px] rounded-full animate-pulse" style={{ animationDuration: '7s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-2xl mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 glow-primary"
          >
            <ShieldCheck className="w-12 h-12" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-display font-black tracking-tight mb-3 text-foreground"
          >
            CipherVault
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-lg flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-primary" /> Secure Protocol v4.0
          </motion.p>
        </div>

        <Card className="glass-panel border-white/10 shadow-2xl overflow-hidden relative">
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
          
          <CardContent className="p-10">
            {/* Offline warning */}
            {!isOnline && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-500"
              >
                <WifiOff className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Network Unavailable</p>
                  <p className="text-xs opacity-80">Please check your internet connection</p>
                </div>
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                    <User className="w-3 h-3" /> Identity
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="h-12 pl-12 rounded-xl glass-input border-white/5 bg-white/5 focus-visible:ring-primary/40"
                      disabled={!isOnline}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                    <Key className="w-3 h-3" /> Knowledge Factor
                  </Label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Codephrase"
                      className="h-12 pl-12 rounded-xl glass-input border-white/5 bg-white/5 focus-visible:ring-primary/40"
                      disabled={!isOnline}
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-destructive-foreground bg-destructive/20 p-4 rounded-xl border border-destructive/20 backdrop-blur-sm flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isDisabled}
                className="w-full h-14 text-lg font-black rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 group overflow-hidden relative"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    <Sparkles className="w-5 h-5" /> Initialize Session <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-shift" style={{ backgroundSize: '200% 100%' }} />
              </Button>
            </form>

            <div className="mt-8 text-center">
              <span className="text-muted-foreground text-sm">Operator not registered? </span>
              <Link href="/register" className="text-primary hover:text-primary/80 font-bold transition-colors inline-flex items-center gap-1">
                Apply Credentials <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
