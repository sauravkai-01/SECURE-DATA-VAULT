const fs = require('fs');

const DASHBOARD_CONTENT = `import { useState, useMemo } from "react";
import { useItems } from "@/hooks/use-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TagEditor } from "@/components/tag-editor";
import { 
  FileText, 
  MoreVertical, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Clock, 
  ShieldCheck, 
  Loader2,
  FileIcon,
  Video,
  Box,
  Image as ImageIcon,
  QrCode,
  Download,
  AlertTriangle,
  Zap,
  Activity,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  Star,
  CheckSquare,
  Square,
  FolderOpen,
  Tag,
  RotateCcw,
  LayoutGrid,
  List
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EncryptedItem, AuditLog } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function QrModal({ item, open, onClose }: { item: EncryptedItem | null; open: boolean; onClose: () => void }) {
  const isExpired = item ? new Date() > new Date(item.expiresAt) : false;
  const { data, isLoading } = useQuery<{ qrCode: string }>({
    queryKey: ["/api/items", item?.id, "qr"],
    queryFn: async () => {
      const res = await fetch(\\`/api/items/\\${item!.id}/qr\\`, { credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      return res.json();
    },
    enabled: open && !!item && !isExpired,
  });
  const handleDownload = () => {
    if (!data?.qrCode) return;
    const link = document.createElement("a");
    link.href = data.qrCode;
    link.download = \\`qr-\\${item?.originalName ?? "secure-link"}.png\\`;
    link.click();
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm text-center glass-panel border-white/5">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl font-black text-foreground">
            <QrCode className="w-6 h-6 text-primary" />
            Secure Share
          </DialogTitle>
          <DialogDescription className="truncate">{item?.originalName}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {isExpired ? (
            <div className="flex flex-col items-center gap-2 py-6 text-destructive">
              <AlertTriangle className="w-10 h-10" />
              <p className="font-medium">Link has expired</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data?.qrCode ? (
            <>
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-4 bg-white rounded-3xl shadow-2xl shadow-primary/20">
                <img src={data.qrCode} alt="QR Code" className="w-48 h-48" />
              </motion.div>
              <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-3 text-sm w-full justify-center">
                <span className="text-muted-foreground font-medium">Access Code:</span>
                <span className="font-mono font-black text-primary tracking-widest text-lg">{item?.accessCode}</span>
              </div>
              <Button onClick={handleDownload} className="w-full h-12 rounded-xl gap-2 font-bold shadow-xl shadow-primary/20">
                <Download className="w-5 h-5" /> Download QR
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InspectorModal({ item, open, onClose }: { item: EncryptedItem | null; open: boolean; onClose: () => void }) {
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl glass-panel border-black/10 overflow-hidden p-0">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-primary" />
        <div className="p-8 space-y-8">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileIcon className="w-8 h-8" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black text-foreground mb-1">{item.originalName}</DialogTitle>
                  <DialogDescription className="font-mono text-xs uppercase tracking-widest text-primary/60">
                    CID: {item.hash.substring(0, 16)}...
                  </DialogDescription>
                </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-full font-bold">ENCRYPTED</Badge>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">MIME Type</span>
              <p className="font-bold text-sm">{item.fileType}</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Sealed At</span>
              <p className="font-bold text-sm">{format(new Date(item.createdAt), "PPP p")}</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Folder</span>
              <p className="font-bold text-sm flex items-center gap-1">
                <FolderOpen className="w-3 h-3" /> {item.folder || "General"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Expires</span>
              <p className="font-bold text-sm">{format(new Date(item.expiresAt), "PPP p")}</p>
            </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary/80">Security Payload</h4>
            <Card className="bg-black/5 border-dashed border-black/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Initialization Vector (IV)</span>
                <code className="text-xs font-mono bg-black/10 px-2 py-1 rounded text-foreground/70">{item.iv}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Salt Entropy</span>
                <code className="text-xs font-mono bg-black/10 px-2 py-1 rounded text-foreground/70">{item.salt}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">HMAC Signature</span>
                <code className="text-xs font-mono bg-black/10 px-2 py-1 rounded text-foreground/70">{item.hmac.substring(0, 24)}...</code>
              </div>
            </Card>
          </div>
          {item.aiSummary && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Cognitive Analysis
              </h4>
              <div className="p-6 rounded-2xl bg-accent/5 border border-accent/10 italic text-sm leading-relaxed text-foreground/80">
                "{item.aiSummary}"
              </div>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary/80 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-full px-3 py-1">{tag}</Badge>
                ))}
              </div>
          )}
          <div className="flex gap-4">
            <Button className="flex-1 h-14 rounded-xl gap-2 font-bold" variant="default">
              <Download className="w-5 h-5" /> Download Asset
            </Button>
            <Button className="flex-1 h-14 rounded-xl gap-2 font-bold" variant="secondary">
              <ExternalLink className="w-5 h-5" /> View Public Link
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { items, trashedItems, folders, isLoading, deleteItem, trashItem, restoreItem } = useItems();
  const { toast } = useToast();
  const [qrItem, setQrItem] = useState<EncryptedItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [inspectorItem, setInspectorItem] = useState<EncryptedItem | null>(null);
  const [tagEditorItem, setTagEditorItem] = useState<EncryptedItem | null>(null);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [view, setView] = useState<"active" | "trash">("active");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [displayMode, setDisplayMode] = useState<"list" | "grid">("list");

  const { data: logs } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const favoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", \\`/api/items/\\${id}/favorite\\`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    }
  });

  const currentItems = view === "active" ? items : trashedItems;

  const filteredItems = useMemo(() => {
    if (!currentItems) return [];
    return currentItems.filter(item => {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        item.originalName.toLowerCase().includes(searchLower) ||
        (item.aiSummary?.toLowerCase() || "").includes(searchLower) ||
        (item.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower)) || false);
      const matchesType = filterType === "all" || 
        (filterType === "favorites" && item.isFavorite) ||
        (filterType === "images" && item.fileType.startsWith("image/")) ||
        (filterType === "videos" && item.fileType.startsWith("video/")) ||
        (filterType === "documents" && (item.fileType.includes("pdf") || item.fileType.includes("word") || item.fileType === "text/plain"));
      const matchesFolder = folderFilter === "all" || item.folder === folderFilter;
      return matchesSearch && matchesType && matchesFolder;
    });
  }, [currentItems, search, filterType, folderFilter]);

  const chartData = useMemo(() => {
    if (!logs) return [];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, "MMM d");
    }).reverse();
    return last7Days.map(day => ({
      name: day,
      actions: logs.filter(l => format(new Date(l.createdAt), "MMM d") === day).length
    }));
  }, [logs]);

  const stats = useMemo(() => {
    const totalItems = items?.length || 0;
    const activeLinks = items?.filter((i: EncryptedItem) => new Date(i.expiresAt) > new Date()).length || 0;
    const totalActions = logs?.length || 0;
    const trashCount = trashedItems?.length || 0;
    return { totalItems, activeLinks, totalActions, trashCount };
  }, [items, logs, trashedItems]);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === filteredItems.length) setSelectedIds([]);
    else setSelectedIds(filteredItems.map(i => i.id));
  };

  const handleBulkDelete = async () => {
    setIsDeletingBulk(true);
    try {
      for (const id of selectedIds) { await deleteItem(id); }
      setSelectedIds([]);
      toast({ title: "Bulk Cleanup Complete", description: "Selected assets have been permanently shredded." });
    } catch (e) {
      toast({ title: "Error", description: "Some assets could not be deleted.", variant: "destructive" });
    } finally { setIsDeletingBulk(false); }
  };

  const handleBulkTrash = async () => {
    try {
      for (const id of selectedIds) { await trashItem(id); }
      setSelectedIds([]);
      toast({ title: "Moved to Trash", description: "Selected assets moved to trash." });
    } catch (e) {
      toast({ title: "Error", description: "Some assets could not be moved.", variant: "destructive" });
    }
  };

  const handleBulkRestore = async () => {
    try {
      for (const id of selectedIds) { await restoreItem(id); }
      setSelectedIds([]);
      toast({ title: "Restored", description: "Selected assets restored to vault." });
    } catch (e) {
      toast({ title: "Error", description: "Some assets could not be restored.", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    const selectedData = items?.filter((i: EncryptedItem) => selectedIds.includes(i.id)) || [];
    if (selectedData.length === 0) return;
    const headers = ["ID", "Name", "Type", "Folder", "Created", "AI Summary", "Link ID"];
    const rows = selectedData.map((i: EncryptedItem) => [
      i.id, i.originalName, i.fileType, i.folder || "General",
      format(new Date(i.createdAt), "yyyy-MM-dd HH:mm:ss"),
      (i.aiSummary || "").replace(/,/g, ";"), i.linkId
    ]);
    const csvContent = [headers, ...rows].map((e: any[]) => e.join(",")).join("\\\\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = \\`vault-manifest-\\${format(new Date(), "yyyy-MM-dd")}.csv\\`;
    link.click();
    toast({ title: "Export Complete", description: \\`Manifest for \\${selectedData.length} assets generated.\\` });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Secure link copied to clipboard." });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (type.startsWith("video/")) return <Video className="w-5 h-5 text-purple-400" />;
    if (type.includes("model")) return <Box className="w-5 h-5 text-orange-400" />;
    return <FileIcon className="w-5 h-5 text-green-400" />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Decrypting your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <QrModal item={qrItem} open={!!qrItem} onClose={() => setQrItem(null)} />
      <InspectorModal item={inspectorItem} open={!!inspectorItem} onClose={() => setInspectorItem(null)} />
      {tagEditorItem && <TagEditor item={tagEditorItem} onClose={() => setTagEditorItem(null)} />}
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">Cyber Protection Active</span>
          </div>
          <h1 className="text-5xl font-display font-black text-foreground leading-tight">Security Command</h1>
          <p className="text-muted-foreground mt-2 text-lg">Real-time surveillance and encrypted asset control.</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="glass-panel border-black/5 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Security Score</span>
              <span className="text-xl font-black">98/100</span>
            </div>
          </Card>
          <Link href="/upload">
            <Button className="h-16 px-10 text-lg rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 gap-3 font-bold transition-all hover:scale-105 active:scale-95 text-primary-foreground">
              <ShieldCheck className="w-6 h-6" />
              Ingest Asset
            </Button>
          </Link>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Secured Items", value: stats.totalItems, icon: Box, color: "text-blue-400" },
          { label: "Active Links", value: stats.activeLinks, icon: Zap, color: "text-amber-400" },
          { label: "Security Events", value: stats.totalActions, icon: Activity, color: "text-emerald-400" },
          { label: "In Trash", value: stats.trashCount, icon: Trash2, color: "text-rose-400" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card overflow-hidden group cursor-pointer" onClick={() => s.label === "In Trash" && setView("trash")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{s.label}</p>
                    <h3 className="text-3xl font-black text-foreground">{s.value}</h3>
                  </div>
                  <div className={\\`p-3 rounded-2xl bg-black/5 \\${s.color} group-hover:scale-110 transition-transform\\`}>
                    <s.icon className="w-6 h-6" />
                  </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 glass-panel border-black/5 p-6 h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-black text-xl flex items-center gap-2 text-foreground">
                <Activity className="w-5 h-5 text-primary" />
                Security Insights
              </h3>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Live Stream</Badge>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground)/.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => \\`\\${value}\\`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }} />
                  <Area type="monotone" dataKey="actions" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="glass-panel border-black/5 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-black text-xl text-foreground mb-6">Storage Integrity</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-muted-foreground uppercase">Vault Capacity</span>
                    <span className="text-foreground">72%</span>
                  </div>
                  <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-gradient-to-r from-primary to-accent" />
                  </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 border border-black/5">
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold">Documents</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">1.2 GB</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 border border-black/5">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold">Encrypted Media</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">4.8 GB</span>
                  </div>
              </div>
            <Button variant="outline" className="w-full mt-6 rounded-xl border-black/5 hover:bg-black/5 font-bold text-xs py-5">Run Integrity Audit</Button>
          </Card>
        </div>
        <Card className="glass-panel border-black/5 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-black text-xl text-foreground">Operational Log</h3>
            <Link href="/activity">
              <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">Full Audit</Button>
            </Link>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px] pr-2 scrollbar-hide">
            {logs?.slice(0, 8).map((log: AuditLog, i: number) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4 items-start group relative">
                <div className="relative mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] z-10 relative" />
                  {i < 7 && <div className="absolute top-2 left-[3px] w-[1px] h-12 bg-primary/10" />}
                </div>
                <div className="flex flex-col flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{log.action}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{format(new Date(log.createdAt), "HH:mm")}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-snug line-clamp-2 bg-black/5 p-2 rounded-lg border border-black/5 group-hover:border-primary/20 transition-all">{log.details}</span>
                </div>
              </motion.div>
            ))}
            {(!logs || logs.length === 0) && (
              <div className="text-center py-20 opacity-20">
                <Activity className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">No Security Events</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-4">
            <h3 className="font-display font-black text-2xl flex items-center gap-3 text-foreground">
              <Box className="w-6 h-6 text-primary" />
              {view === "active" ? "Vault Inventory" : "Trash"}
            </h3>
            <Tabs value={view} onValueChange={(v) => { setView(v as "active" | "trash"); setSelectedIds([]); }}>
              <TabsList className="bg-black/5">
                <TabsTrigger value="active" className="text-xs font-bold">Active</TabsTrigger>
                <TabsTrigger value="trash" className="text-xs font-bold gap-1">
                  <Trash2 className="w-3 h-3" /> Trash
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-48 lg:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assets..." className="pl-9 glass-input h-10 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {view === "active" && folders && folders.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-xl gap-2 border-white/5 bg-white/5 hover:bg-white/10 text-foreground text-xs">
                    <FolderOpen className="w-3 h-3" />
                    {folderFilter === "all" ? "All Folders" : folderFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass-panel border-white/5">
                  <DropdownMenuItem onClick={() => setFolderFilter("all")} className="rounded-lg text-xs">All Folders</DropdownMenuItem>
                  {folders.map((f: string) => (
                    <DropdownMenuItem key={f} onClick={() => setFolderFilter(f)} className="rounded-lg text-xs">{f}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl gap-2 border-white/5 bg-white/5 hover:bg-white/10 text-foreground text-xs">
                  <Filter className="w-3 h-3" />
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 glass-panel border-white/5">
                {[ "all", "favorites", "images", "videos", "documents" ].map((t) => (
                  <DropdownMenuItem key={t} onClick={() => setFilterType(t)} className="capitalize rounded-lg gap-3 text-xs">
                    {t === "favorites" && <Star className="w-3 h-3 text-amber-400" />}
                    {t}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex bg-black/5 rounded-lg p-0.5">
              <button onClick={() => setDisplayMode("list")} className={\\`p-2 rounded-md transition-all \\${displayMode === "list" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"}\\`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setDisplayMode("grid")} className={\\`p-2 rounded-md transition-all \\${displayMode === "grid" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"}\\`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between px-6 mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-4 text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-foreground text-xs font-bold">{selectedIds.length}</div>
                  <span className="font-bold text-sm">Assets Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  {view === "active" && (
                    <>
                      <Button variant="ghost" size="sm" className="text-foreground hover:bg-white/5 rounded-xl gap-2 font-bold" onClick={exportToCSV}>
                        <Download className="w-4 h-4" /> Export
                      </Button>
                      <Button variant="ghost" size="sm" className="text-foreground hover:bg-white/5 rounded-xl gap-2 font-bold" onClick={handleBulkTrash}>
                        <Trash2 className="w-4 h-4" /> Move to Trash
                      </Button>
                    </>
                  )}
                  {view === "trash" && (
                    <Button variant="ghost" size="sm" className="text-foreground hover:bg-white/5 rounded-xl gap-2 font-bold" onClick={handleBulkRestore}>
                      <RotateCcw className="w-4 h-4" /> Restore
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-foreground hover:bg-white/5 rounded-xl" onClick={() => setSelectedIds([])}>Clear</Button>
                  <Button variant="destructive" size="sm" className="rounded-xl gap-2 bg-rose-500/80 hover:bg-rose-500 text-foreground" onClick={handleBulkDelete} disabled={isDeletingBulk}>
                    {isDeletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4
