import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Shield,
  Lock,
  Smartphone,
  Eye,
  Trash2,
  Save,
  Fingerprint,
  Zap,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

function useLocalStorageToggle(key: string, defaultValue: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const setStored = (v: boolean) => {
    localStorage.setItem(key, JSON.stringify(v));
    setValue(v);
  };
  return [value, setStored];
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [mfaEnabled, setMfaEnabled] = useLocalStorageToggle("vault_mfa", false);
  const [autoLock, setAutoLock] = useLocalStorageToggle("vault_autolock", true);
  const [zkPreview, setZkPreview] = useLocalStorageToggle("vault_zkpreview", true);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleSave = () => {
    toast({
      title: "Configuration Saved",
      description: "Your security preferences have been synchronized.",
    });
  };

  const handleUpgrade = () => {
    toast({
      title: "Coming Soon",
      description: "Vault Pro will be available in the next release.",
    });
  };

  const handleToggle = (setter: (v: boolean) => void, value: boolean, label: string) => {
    setter(!value);
    toast({
      title: `${label} ${!value ? "Enabled" : "Disabled"}`,
      description: `Your preference has been saved locally.`,
    });
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast({ title: "Confirmation required", description: "Type DELETE to confirm.", variant: "destructive" });
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/account", { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete account");
      toast({ title: "Account Terminated", description: "All data has been permanently removed." });
      logout();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-10 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-mesh bg-grid pointer-events-none opacity-50" />
      
      <div className="relative">
        <h1 className="text-4xl font-display font-black text-foreground mb-2 flex items-center gap-3">
          <motion.div 
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg"
          >
            <SettingsIcon className="w-6 h-6" />
          </motion.div>
          System Configuration
        </h1>
        <p className="text-muted-foreground">Manage your cryptographic environment and vault security protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Identity Section */}
          <Card className="glass-panel border-white/5">
            <CardHeader className="border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Operator Identity</CardTitle>
                  <CardDescription>Update your public profile and communication channels.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-60">Username</Label>
                  <Input defaultValue={user?.username} disabled className="glass-input bg-white/5 border-white/5" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-60">Email Address</Label>
                  <Input defaultValue={user?.email} className="glass-input bg-white/5 border-white/5 focus:border-primary/50" />
                </div>
              </div>
              <Button onClick={handleSave} className="gap-2 rounded-xl h-11 px-6 shadow-xl shadow-primary/20">
                <Save className="w-4 h-4" /> Save Profile
              </Button>
            </CardContent>
          </Card>

{/* Security Protocols */}
          <Card className="glass-panel border-white/5 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-accent" />
            <CardHeader className="border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500 border border-amber-500/20"
                >
                  <Shield className="w-5 h-5" />
                </motion.div>
                <div>
                  <CardTitle>Security Protocols</CardTitle>
                  <CardDescription>Configure multi-factor authentication and encryption defaults.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary group-hover:scale-110 transition-transform glow-primary-sm">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Multi-Factor Authentication (2FA)</h4>
                    <p className="text-sm text-muted-foreground">Require a verification code from your mobile device.</p>
                  </div>
                </div>
                <Switch
                  checked={mfaEnabled}
                  onCheckedChange={() => handleToggle(setMfaEnabled, mfaEnabled, "2FA")}
                  className="data-[state=checked]:bg-primary"
                />
              </motion.div>

              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 hover:border-violet-500/20 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-500 group-hover:scale-110 transition-transform">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Auto-Lock Session</h4>
                    <p className="text-sm text-muted-foreground">Automatically log out after period of inactivity.</p>
                  </div>
                </div>
                <Switch
                  checked={autoLock}
                  onCheckedChange={() => handleToggle(setAutoLock, autoLock, "Auto-Lock")}
                  className="data-[state=checked]:bg-violet-500"
                />
              </motion.div>

              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 hover:border-cyan-500/20 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-500 group-hover:scale-110 transition-transform">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Zero-Knowledge Preview</h4>
                    <p className="text-sm text-muted-foreground">Allow AI to summarize text content for easier indexing.</p>
                  </div>
                </div>
                <Switch
                  checked={zkPreview}
                  onCheckedChange={() => handleToggle(setZkPreview, zkPreview, "Zero-Knowledge Preview")}
                  className="data-[state=checked]:bg-cyan-500"
                />
              </motion.div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
{/* Quick Stats / Subscription */}
          <Card className="glass-panel border-white/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
            <CardContent className="p-8 text-center relative">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-primary/40 glow-primary"
              >
                <Zap className="w-8 h-8 fill-current" />
              </motion.div>
              <h3 className="text-2xl font-black mb-2">Vault Pro</h3>
              <p className="text-sm text-muted-foreground mb-8">Unlimited storage, higher entropy rounds, and priority AI analysis.</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-black hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                Upgrade Now
              </motion.button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="glass-panel border-rose-500/20 bg-rose-500/5">
            <CardHeader>
              <CardTitle className="text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Permanently delete your account and all encrypted assets from our servers.</p>
              <Button
                variant="destructive"
                className="w-full rounded-xl gap-2 font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                onClick={() => setShowDeleteDialog(true)}
              >
                Terminate Identity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md glass-panel border-rose-500/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              Terminate Identity
            </DialogTitle>
            <DialogDescription>
              This action is irreversible. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Type <strong className="text-foreground">DELETE</strong> to confirm account termination.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE..."
              className="bg-white/5 border-white/10"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmText !== "DELETE"}
              className="rounded-xl gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Terminate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

