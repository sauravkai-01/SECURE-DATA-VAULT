import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, Lock, Upload, Key, Globe, 
  ArrowRight, Sparkles, Database, Zap, 
  ChevronRight, Fingerprint, Activity,
  Cpu
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent text-foreground selection:bg-primary/20 overflow-x-hidden">
{/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-background" />
      <div className="fixed inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-foreground/5 bg-background/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center text-white shadow-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-display font-black text-2xl tracking-tighter uppercase italic">CipherVault</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-black uppercase tracking-widest text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Technology</a>
            <a href="#security" className="hover:text-primary transition-colors">Security</a>
            <a href="#ai" className="hover:text-primary transition-colors">AI Core</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-black uppercase tracking-widest">Sign In</Button>
            </Link>
            <Link href="/register">
<Button className="h-10 px-6 font-black uppercase tracking-widest bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-xl">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge variant="outline" className="mb-6 py-2 px-4 rounded-full border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                  <Sparkles className="w-3 h-3 mr-2" /> Artificial Intelligence Integrated
                </Badge>
                <h1 className="text-6xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-8 text-foreground uppercase">
                  Protect <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x">Everything</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed font-medium">
                  The world's most advanced zero-knowledge vault. We use military-grade 256-bit encryption to secure your assets before they even touch the cloud.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button size="lg" className="h-16 px-10 text-lg font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 rounded-2xl gap-3">
                      Start Ingesting <Zap className="w-5 h-5 fill-current" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-black uppercase tracking-widest border-foreground/10 hover:bg-foreground/5 rounded-2xl">
                      Access Terminal
                    </Button>
                  </Link>
                </div>

                {/* Trust strip */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="glass-card rounded-2xl p-4 border-primary/10">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <div className="text-[11px] font-black uppercase tracking-widest text-foreground">
                        Zero-knowledge by design
                      </div>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-4 border-primary/10">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-primary" />
                      <div className="text-[11px] font-black uppercase tracking-widest text-foreground">
                        AES-GCM 256-bit encryption
                      </div>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-4 border-primary/10">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-accent" />
                      <div className="text-[11px] font-black uppercase tracking-widest text-foreground">
                        Single-use access links
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro CTA */}
                <div className="mt-8 flex items-center justify-start gap-3">
                  <a
                    href="#security"
                    className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                    See how it works <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-primary/20 blur-[150px] -z-10 rounded-full" />
              <div className="w-full h-auto rounded-[3rem] shadow-2xl animate-float border border-white/5 overflow-hidden">
                {/* Fallback visual (replaces broken file:/// asset) */}
                <div className="relative">
                  <div className="absolute inset-0 bg-mesh bg-grid opacity-30" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.35),transparent_55%),radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.25),transparent_50%)]" />
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04]" />
                  <svg
                    viewBox="0 0 900 700"
                    className="relative z-10 w-full h-auto"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-label="CipherVault Core"
                  >
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                        <stop offset="0.5" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
                        <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                      </linearGradient>
                      <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="18" />
                      </filter>
                    </defs>
                    <rect x="30" y="30" width="840" height="640" rx="60" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.10)" />
                    <circle cx="450" cy="350" r="190" fill="url(#g)" opacity="0.18" filter="url(#blur)" />
                    <circle cx="450" cy="350" r="125" fill="none" stroke="url(#g)" strokeWidth="10" opacity="0.75" />
                    <circle cx="450" cy="350" r="85" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
                    <path d="M280 360 C 340 250, 560 250, 620 360" fill="none" stroke="url(#g)" strokeWidth="8" strokeLinecap="round" opacity="0.8" />
                    <path d="M310 420 C 360 480, 540 480, 590 420" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
                    <text x="450" y="400" textAnchor="middle" fontFamily="inherit" fontWeight="900" fontSize="30" fill="rgba(255,255,255,0.75)" letterSpacing="6">
                      CORE
                    </text>
                    <text x="450" y="445" textAnchor="middle" fontFamily="inherit" fontWeight="800" fontSize="14" fill="rgba(255,255,255,0.5)" letterSpacing="4">
                      ZERO-KNOWLEDGE VAULT
                    </text>
                  </svg>
                </div>
              </div>
              {/* Floating Status Cards */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -right-10 glass-panel p-6 rounded-3xl border-primary/20 shadow-2xl"
              >
                <div className="flex items-center gap-3 text-primary font-black uppercase tracking-widest text-[10px]">
                  <Fingerprint className="w-5 h-5" /> 2FA Verified
                </div>
              </motion.div>
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-10 -left-10 glass-panel p-6 rounded-3xl border-accent/20 shadow-2xl"
              >
                <div className="flex items-center gap-3 text-accent font-black uppercase tracking-widest text-[10px]">
                  <Activity className="w-5 h-5" /> Live Surveillance
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Technical Features */}
        <section id="features" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-display font-black text-foreground uppercase tracking-widest mb-4">Tactical Advantages</h2>
              <p className="text-muted-foreground text-lg">Sophisticated protection layers for a modern digital landscape.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={Lock} 
                title="AES-GCM 256-Bit" 
                detail="Galois/Counter Mode provides high-performance authenticated encryption with data integrity." 
                stat="Military"
              />
              <FeatureCard 
                icon={Key} 
                title="PBKDF2 Derivation" 
                detail="We implement 100,000 iterations of SHA-256 to ensure your master key is mathematically untouchable." 
                stat="Locked"
              />
              <FeatureCard 
                icon={Globe} 
                title="Secure Relay" 
                detail="Generate single-use links with 4-digit MFA codes for secure asset transmission over public channels." 
                stat="Global"
              />
              <FeatureCard 
                icon={Database} 
                title="Zero Knowledge" 
                detail="Your cleartext data never touches our disks. Encryption occurs locally within the browser terminal." 
                stat="Private"
              />
              <FeatureCard 
                icon={Cpu} 
                title="Neural Scan" 
                detail="Deep-learning scanning for malware patterns before assets are admitted to the secure vault." 
                stat="Active"
              />
              <FeatureCard 
                icon={Sparkles} 
                title="AI Intelligence" 
                detail="Automatic neural analysis of text payloads to generate context-aware summaries and metadata." 
                stat="Smart"
              />
            </div>
          </div>
        </section>

        {/* AI Core Section (matches nav anchor) */}
        <section id="ai" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10 mb-14">
              <div>
                <h2 className="text-5xl font-display font-black uppercase mb-4">AI Core</h2>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  CipherVault’s intelligence layer generates summaries & metadata while keeping sensitive content encrypted end-to-end.
                </p>
              </div>
              <div className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Powered by local inference signals + security gates
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                whileHover={{ y: -8 }}
                className="glass-panel p-8 rounded-3xl border-foreground/5 shadow-2xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest mb-4">Context Summaries</h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  Produce human-readable summaries for fast retrieval—without exposing raw content.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -8 }}
                className="glass-panel p-8 rounded-3xl border-foreground/5 shadow-2xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest mb-4">Metadata Extraction</h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  Tag, classify, and enrich encrypted payloads to improve search, sorting, and audit trails.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -8 }}
                className="glass-panel p-8 rounded-3xl border-foreground/5 shadow-2xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest mb-4">Safety Filters</h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  Apply security gates before ingestion—keeping high-risk content away from the vault.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Security architecture Section */}
        <section id="security" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
             <div className="glass-panel rounded-[4rem] p-12 md:p-20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                  <div>
                    <h2 className="text-5xl font-display font-black uppercase mb-8">Security <br /> Architecture</h2>
                    <ul className="space-y-8">
                      <li className="flex gap-6">
                         <div className="mt-1 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                           <ShieldCheck className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="text-lg font-black uppercase mb-2">Salted Entropy</h4>
                            <p className="text-muted-foreground leading-relaxed">Unique 128-bit random salts are generated for every file, creating an impenetrable defense against rainbow table attacks.</p>
                         </div>
                      </li>
                      <li className="flex gap-6">
                         <div className="mt-1 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                           <Zap className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="text-lg font-black uppercase mb-2">Instant Sealing</h4>
                            <p className="text-muted-foreground leading-relaxed">Files are sealed into .enc containers using Galois/Counter Mode (GCM) for combined encryption and authentication.</p>
                         </div>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-black/80 rounded-3xl p-10 font-mono text-sm text-primary/80 border border-primary/20 shadow-2xl">
                    <div className="flex items-center gap-2 mb-6 opacity-40">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="ml-4 text-[10px] tracking-widest font-black">ENCRYPTION_ENGINE.PY</span>
                    </div>
                    <p className="mb-2 text-primary font-bold">def seal_asset(payload, password):</p>
                    <p className="pl-4 opacity-70"># Generate 16-byte cryptographically secure salt</p>
                    <p className="pl-4 mb-2 text-blue-400">salt = os.urandom(16)</p>
                    <p className="pl-4 opacity-70"># Derive 256-bit key through 100k iterations</p>
                    <p className="pl-4 mb-2 text-blue-400">key = derive_key(password, salt)</p>
                    <p className="pl-4 opacity-70"># AES-256-GCM Encryption with 96-bit IV</p>
                    <p className="pl-4 mb-8 text-blue-400">ciphertext, tag = aes_gcm_encrypt(payload, key)</p>
                    <p className="text-emerald-500 border-t border-emerald-500/20 pt-4 font-black tracking-widest">{">>>"} STATUS: SECURE_CONTAINER_READY</p>
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-foreground/5">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-display font-black text-xl tracking-tighter uppercase italic">CipherVault</span>
            </div>
            <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">API Reference</a>
              <a href="#" className="hover:text-primary transition-colors">Security Audit</a>
              <a href="#" className="hover:text-primary transition-colors">Status</a>
            </div>
          </div>
          <p className="text-center text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground/30 mt-20">
            All Rights Reserved © 2026 CipherVault Neural Security Systems
          </p>
        </footer>
      </main>
    </div>
  );
}

type LucideIcon = React.ComponentType<{ className?: string }>;

function FeatureCard({ icon: Icon, title, detail, stat }: { icon: LucideIcon; title: string; detail: string; stat: string }) {

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="glass-panel p-8 rounded-3xl border-foreground/5 hover:border-primary/30 transition-all duration-300 group shadow-2xl shadow-primary/2"
    >
      <div className="flex justify-between items-start mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
          <Icon className="w-6 h-6" />
        </div>
        <div className="px-3 py-1 rounded-full border border-foreground/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
          {stat}
        </div>
      </div>
      <h3 className="text-xl font-black uppercase tracking-widest mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm font-medium">{detail}</p>
      <div className="mt-8 flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
        Technical Specs <ChevronRight className="w-3 h-3" />
      </div>
    </motion.div>
  );
}
