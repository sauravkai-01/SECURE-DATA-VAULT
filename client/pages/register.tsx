import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { Shield, Loader2, Mail, User, Key, ArrowRight, Sparkles, Lock, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function Register() {
  const { register, isRegistering, isOnline } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const isDisabled = isRegistering || !isOnline;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Client-side validation
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!formData.password) {
      setError("Password is required");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Enhanced ambient background */}
      <div className="absolute inset-0 bg-mesh bg-grid pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-secondary/20 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-primary/15 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '5s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-2xl mx-auto mb-4 glow-primary"
          >
            <Shield className="w-10 h-10" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-display font-black tracking-tight mb-2"
          >
            Create Account
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary" /> Join CipherVault
          </motion.p>
        </div>

        <Card className="glass-panel border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent" />
          
          <CardContent className="p-8">
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
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <User className="w-3 h-3" /> Username
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Choose a username"
                    className="h-12 pl-12 rounded-xl glass-input border-white/5 bg-white/5"
                    disabled={!isOnline}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="h-12 pl-12 rounded-xl glass-input border-white/5 bg-white/5"
                    disabled={!isOnline}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <Key className="w-3 h-3" /> Password
                </Label>
                <div className="relative group">
                  <Key className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="h-12 pl-12 rounded-xl glass-input border-white/5 bg-white/5"
                    disabled={!isOnline}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-destructive-foreground bg-destructive/20 p-3 rounded-xl border border-destructive/20 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isDisabled}
                className="w-full h-12 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 group relative overflow-hidden"
              >
                {isRegistering ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    <Sparkles className="w-4 h-4" /> Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-shift" style={{ backgroundSize: '200% 100%' }} />
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors inline-flex items-center gap-1">
                Sign In <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
