import { useState, useEffect } from "react";
import { useAccessItem } from "@/hooks/use-items";
import { useRoute } from "wouter";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FileIcon, 
  Download, 
  Eye, 
  Loader2,
  AlertTriangle,
  WifiOff,
  Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function AccessPage() {
  const [, params] = useRoute("/access/:linkId");
  const linkId = params?.linkId || "";
  
  const { mutate: accessItem, isPending, error, data } = useAccessItem();
  
  const [step, setStep] = useState<"auth" | "result">("auth");
  const [accessCode, setAccessCode] = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (error) {
      setErrMsg(error.message);
    }
  }, [error]);

const handleUnlock = () => {
    // Check network status
    if (!isOnline) {
      setErrMsg("Network unavailable. Please check your connection and try again.");
      return;
    }
    
    if (accessCode.length !== 4) {
      setErrMsg("Please enter the 4-digit access code.");
      return;
    }
    if (!password) {
      setErrMsg("Password is required for decryption.");
      return;
    }
    if (password.length < 6) {
      setErrMsg("Password must be at least 6 characters.");
      return;
    }
    
    setErrMsg("");
    accessItem(
      { linkId, accessCode, password },
      {
        onSuccess: () => {
          setStep("result");
          setRetryCount(0);
        },
        onError: (err: Error) => {
          setRetryCount(prev => prev + 1);
          // Improve error messages based on error type
          const message = err.message.toLowerCase();
          if (message.includes("expired")) {
            setErrMsg("This secure link has expired and is no longer accessible.");
          } else if (message.includes("incorrect") || message.includes("invalid")) {
            setErrMsg("Access code or password is incorrect. Please verify and try again.");
          } else if (message.includes("not found")) {
            setErrMsg("This secure link does not exist or has been removed.");
          } else if (message.includes("429") || message.includes("rate limit")) {
            setErrMsg("Too many attempts. Please wait a moment before trying again.");
          } else {
            setErrMsg(err.message);
          }
        }
      }
    );
  };

  const handleDownload = () => {
    if (!data || !data.data) return;
    
    // Create download link
    const link = document.createElement("button"); // Using button trick to avoid linting issues if any, but anchor is standard
    const a = document.createElement("a");
    a.href = `data:${data.fileType};base64,${data.data}`;
    a.download = data.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
<div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <AnimatePresence mode="wait">
        {step === "auth" ? (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Secure Access Required</h1>
              <p className="text-muted-foreground">This content is protected with AES-256 encryption.</p>
            </div>

<GlassCard className="p-8" gradient>
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
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-center block text-sm uppercase tracking-wider text-muted-foreground">
                    Enter 4-Digit Access Code
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP 
                      maxLength={4} 
                      value={accessCode} 
                      onChange={setAccessCode}
                      className="gap-2"
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3].map((i) => (
                          <InputOTPSlot 
                            key={i} 
                            index={i} 
                            className="w-14 h-14 text-2xl bg-background/50 border-white/10" 
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pwd">Decryption Password</Label>
                  <Input 
                    id="pwd"
                    type="password" 
                    placeholder="Enter uploader's password"
                    className="bg-background/50 border-white/10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required to reconstruct the decryption key.
                  </p>
                </div>

                {errMsg && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {errMsg}
                  </div>
                )}

                <Button 
                  onClick={handleUnlock}
                  disabled={isPending}
                  className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> 
                  ) : (
                    <Unlock className="w-5 h-5 mr-2" />
                  )}
                  {isPending ? "Decrypting..." : "Unlock Content"}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 text-green-500 border border-green-500/20">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Decryption Successful</h1>
              <p className="text-muted-foreground">Content integrity verified via HMAC-SHA256.</p>
            </div>

            <GlassCard className="p-8">
              <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-secondary/30 border border-white/5">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <FileIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{data?.originalName}</h3>
                  <p className="text-sm text-muted-foreground">{data?.fileType}</p>
                </div>
              </div>

              {data?.originalName === "Secure Message" ? (
                <div className="mb-6 space-y-2">
                  <Label className="text-muted-foreground">Decrypted Message:</Label>
                  <div className="p-6 rounded-xl bg-background/50 border border-white/10 font-mono text-sm whitespace-pre-wrap shadow-inner">
                    {data.data}
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-8 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center bg-white/5">
                  <Eye className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">This file is ready for secure download.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data?.originalName !== "Secure Message" && (
                  <Button onClick={handleDownload} className="h-12 w-full">
                    <Download className="w-4 h-4 mr-2" /> Download Decrypted File
                  </Button>
                )}
                <Button variant="outline" onClick={() => window.location.reload()} className="h-12 w-full border-white/10 hover:bg-white/5">
                  Unlock Another
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
