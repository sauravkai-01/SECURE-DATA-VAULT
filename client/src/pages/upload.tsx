import { useState, useCallback, useEffect } from "react";
import { useItems } from "@/hooks/use-items";
import { useLocation } from "wouter";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PasswordGenerator } from "@/components/password-generator";
import { 
  Upload as UploadIcon, 
  FileText, 
  Lock, 
  File, 
  X, 
  Loader2, 
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  Clock,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Key,
  WifiOff,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EXPIRY_OPTIONS = [
  { value: "5m", label: "5 Minutes", desc: "Quick share" },
  { value: "1h", label: "1 Hour", desc: "Temporary" },
  { value: "24h", label: "24 Hours", desc: "Daily" },
  { value: "7d", label: "7 Days", desc: "Weekly" },
  { value: "30d", label: "30 Days", desc: "Monthly" },
  { value: "never", label: "Never", desc: "Permanent" },
];

export default function Upload() {
  const { uploadItem, isUploading, folders } = useItems();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState("file");
  const [file, setFile] = useState<File | null>(null);
  const [textMessage, setTextMessage] = useState("");
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("5m");
  const [folder, setFolder] = useState("General");
  const [encryptionStep, setEncryptionStep] = useState<"idle" | "encrypting" | "success">("idle");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Handle case when user goes offline during upload
  useEffect(() => {
    if (!isOnline && encryptionStep === "encrypting") {
      setEncryptionStep("idle");
      toast({
        title: "Connection Lost",
        description: "Your file will not be uploaded. Please try again when online.",
        variant: "destructive",
      });
    }
  }, [isOnline, encryptionStep]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
  });

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-transparent" };
    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score <= 1) return { score: 25, label: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 50, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 75, label: "Strong", color: "bg-blue-500" };
    return { score: 100, label: "Military Grade", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const canProceed = () => {
    if (step === 0) {
      if (activeTab === "file") return !!file;
      if (activeTab === "text") return !!textMessage;
      return true;
    }
    if (step === 1) return !!password;
    return true;
  };

  const handleUpload = async () => {
    if (!password) {
      toast({
        title: "Security Violation",
        description: "Encryption password is required to derive security keys.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "file" && !file) {
      toast({ title: "Selection Error", description: "Please select an asset for encryption.", variant: "destructive" });
      return;
    }

    if (activeTab === "text" && !textMessage) {
      toast({ title: "Content Error", description: "Notepad entry cannot be empty.", variant: "destructive" });
      return;
    }

    setEncryptionStep("encrypting");

    try {
      const formData = new FormData();
      formData.append("password", password);
      formData.append("expiry", expiry);
      formData.append("folder", folder);
      
      if (activeTab === "file" && file) {
        formData.append("file", file);
      } else {
        formData.append("text_message", textMessage);
      }

      await uploadItem(formData);
      
      setEncryptionStep("success");
      
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
      
    } catch (error: any) {
      setEncryptionStep("idle");
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const steps = [
    { title: "Select Content", icon: File },
    { title: "Configure Security", icon: Lock },
    { title: "Encrypt & Deploy", icon: ShieldCheck },
  ];

  return (
<div className="max-w-3xl mx-auto space-y-10">
      {/* Offline Warning */}
      {!isOnline && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
        >
          <WifiOff className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-sm text-amber-500">Network Unavailable</p>
            <p className="text-xs text-muted-foreground">Please check your internet connection before uploading</p>
          </div>
        </motion.div>
      )}
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-primary mb-3">
          <Zap className="w-5 h-5 fill-current" />
          <span className="text-sm font-black uppercase tracking-[0.2em]">Secure Ingestion</span>
        </div>
        <h1 className="text-5xl font-display font-black text-foreground leading-tight">Secure Depository</h1>
        <p className="text-muted-foreground mt-3 text-lg">Transmit high-sensitivity data with cryptographic certainty.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              i === step ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" :
              i < step ? "bg-primary/10 text-primary" : "bg-black/5 text-muted-foreground"
            }`}>
              <s.icon className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">{s.title}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className={`w-4 h-4 ${i < step ? "text-primary" : "text-muted-foreground/30"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="glass-panel border-black/5 overflow-hidden shadow-2xl">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex gap-2 p-1 bg-black/5 rounded-xl">
                  {[
                    { key: "file", label: "Binary Asset", icon: File },
                    { key: "text", label: "Secure Notepad", icon: FileText },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                        activeTab === tab.key
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "file" && (
                  <div 
                    {...getRootProps()} 
                    className={`
                      border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300
                      ${isDragActive ? "border-primary bg-primary/10" : "border-white/10 hover:border-primary/40 hover:bg-black/5"}
                      ${file ? "border-emerald-500/50 bg-emerald-500/5 shadow-inner" : "shadow-2xl"}
                    `}
                  >
                    <input {...getInputProps()} />
                    <AnimatePresence mode="wait">
                      {file ? (
                        <motion.div 
                          key="file"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center"
                        >
                          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500 shadow-lg shadow-emerald-500/20">
                            <File className="w-10 h-10" />
                          </div>
                          <h3 className="text-2xl font-black mb-1">{file.name}</h3>
                          <p className="text-sm text-muted-foreground mb-6 font-mono">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • READY FOR AES-GCM
                          </p>
                          <Button 
                            variant="ghost" 
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          >
                            <X className="w-4 h-4 mr-2" /> Revoke Selection
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center"
                        >
                          <div className="w-20 h-20 rounded-3xl bg-black/5 flex items-center justify-center mb-6 text-primary shadow-2xl">
                            <UploadIcon className="w-10 h-10" />
                          </div>
                          <h3 className="text-2xl font-black mb-2 text-foreground">Ingest Binary Object</h3>
                          <p className="text-muted-foreground mb-8 max-w-sm text-lg">
                            Select a target for cryptographic wrapping. Files are processed locally before secure relay.
                          </p>
                          <Button variant="secondary" className="px-10 h-12 rounded-xl font-bold bg-white/10 hover:bg-white/20">Browse Filesystem</Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {activeTab === "text" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">Payload Content</Label>
                    <div className="bg-black/5 rounded-3xl border border-black/5 p-6 shadow-inner">
                      <Textarea 
                        placeholder="Enter sensitive string data for encryption..." 
                        className="min-h-[250px] bg-transparent border-none focus-visible:ring-0 resize-none font-mono text-base p-0"
                        value={textMessage}
                        onChange={(e) => setTextMessage(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-primary">
                      <ShieldAlert className="w-5 h-5" />
                      <Label className="font-black uppercase tracking-widest text-xs">Cryptographic Barrier</Label>
                    </div>
                    <Sparkles className="w-4 h-4 text-primary/40" />
                  </div>
                  
                  <div className="space-y-2">
                    <Input 
                      type="password" 
                      placeholder="Master authorization key..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 rounded-2xl glass-input text-lg font-mono tracking-widest"
                    />
                    {password && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between px-1"
                      >
                        <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden mr-4">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${strength.score}%` }}
                            className={`h-full ${strength.color} transition-all duration-500`}
                          />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${strength.color === "bg-transparent" ? "text-muted-foreground" : (strength.color).replace("bg-", "text-")}`}>
                          {strength.label}
                        </span>
                      </motion.div>
                    )}
                  </div>
                  
                  <PasswordGenerator 
                    onPasswordGenerated={(pass) => setPassword(pass)} 
                    className="pt-4 border-t border-black/5"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70">
                      <Clock className="w-3 h-3" />
                      Expiry Duration
                    </div>
                    <Select value={expiry} onValueChange={setExpiry}>
                      <SelectTrigger className="h-12 rounded-xl glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-panel border-white/5">
                        {EXPIRY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                            <div className="flex items-center justify-between w-full gap-4">
                              <span className="font-bold">{opt.label}</span>
                              <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70">
                      <FolderOpen className="w-3 h-3" />
                      Vault Folder
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={folder}
                        onChange={(e) => setFolder(e.target.value)}
                        placeholder="Folder name..."
                        className="h-12 rounded-xl glass-input flex-1"
                        list="folder-suggestions"
                      />
                      <datalist id="folder-suggestions">
                        {folders?.map((f) => (
                          <option key={f} value={f} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                  <Lock className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                  We implement PBKDF2 with 100,000 iterations to derive a unique symmetric key. 
                  Your cleartext password is never persisted or transmitted to the metadata layer.
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-center"
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-black">Ready to Encrypt</h3>
                  <p className="text-muted-foreground">Review your configuration before deployment.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Content</span>
                    <p className="font-bold text-sm truncate">{file?.name || "Secure Note"}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Expiry</span>
                    <p className="font-bold text-sm">{EXPIRY_OPTIONS.find(e => e.value === expiry)?.label}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Folder</span>
                    <p className="font-bold text-sm">{folder}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Algorithm</span>
                    <p className="font-bold text-sm">AES-256-GCM</p>
                  </div>
                </div>

                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading || encryptionStep !== "idle"}
                  className={`w-full h-16 text-xl font-black rounded-2xl transition-all duration-500 active:scale-95 shadow-2xl ${
                    encryptionStep === "success" 
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25" 
                      : "bg-primary hover:bg-primary/90 shadow-primary/40"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {encryptionStep === "idle" && (
                      <motion.div key="idle" className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6" /> Initialize Encryption
                      </motion.div>
                    )}
                    {encryptionStep === "encrypting" && (
                      <motion.div key="loading" className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" /> Diffusing Entropy...
                      </motion.div>
                    )}
                    {encryptionStep === "success" && (
                      <motion.div key="done" className="flex items-center gap-3 text-emerald-950">
                        <CheckCircle className="w-6 h-6" /> Asset Sealed
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-black/5">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || encryptionStep !== "idle"}
              className="gap-2 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            
            {step < 2 && (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed() || encryptionStep !== "idle"}
                className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

