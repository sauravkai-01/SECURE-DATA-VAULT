import { useMutation, useQuery } from "@tanstack/react-query";
import { EncryptedItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  FileTerminal, Lock, Send, Search, 
  StickyNote, Filter, Trash2, Calendar,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Notepad() {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");

  const { data: items, isLoading } = useQuery<EncryptedItem[]>({
    queryKey: ["/api/items"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { text_message: string; password: string }) => {
      const formData = new FormData();
      formData.append("text_message", data.text_message);
      formData.append("password", data.password);
      const res = await fetch("/api/items/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `Upload failed (${res.status})` }));
        throw new Error(err.message || `Upload failed (${res.status})`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setNote("");
      setPassword("");
      toast({ title: "Note encrypted & saved", description: "Your secure note is now in the vault." });
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Note removed" });
    },
  });

  const notes = items?.filter(i => i.originalName === "text_message.txt" && 
    (search === "" || i.aiSummary?.toLowerCase().includes(search.toLowerCase()))) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-black text-foreground mb-2 flex items-center gap-3">
            <FileTerminal className="w-8 h-8 text-primary" />
            Notepad
          </h1>
          <p className="text-sm text-muted-foreground">Draft and store encrypted notes instantly.</p>
        </div>

        <Card className="glass-panel border-white/5 overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search notes..." 
                className="pl-9 glass-input h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm h-8 rounded-lg">
                <StickyNote className="w-4 h-4" />
                All Notes
                <span className="ml-auto text-xs opacity-50">{notes.length}</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm h-8 rounded-lg opacity-50">
                <Filter className="w-4 h-4" />
                Archived
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3 space-y-6">
        <Card className="glass-panel border-white/10 shadow-primary/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
              <Send className="w-4 h-4" />
              New Encrypted Draft
            </div>
            <Textarea 
              placeholder="Start typing your secret note..." 
              className="min-h-[200px] border-none bg-white/5 focus-visible:ring-0 text-lg resize-none p-0 scrollbar-hide"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4 items-center">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="Encryption Password" 
                  className="pl-9 glass-input h-10 w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => uploadMutation.mutate({ text_message: note, password })}
                disabled={!note || !password || uploadMutation.isPending}
                className="h-10 px-8 rounded-lg shadow-lg shadow-primary/20"
              >
                {uploadMutation.isPending ? "Encrypting..." : "Save Note"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {notes.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <Card className="glass-card h-full group relative">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <StickyNote className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-mono text-primary/70">#SEC-{item.id}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/access/${item.linkId}`}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-semibold mb-2 line-clamp-1">{item.aiSummary || "Encrypted Note"}</h3>
                    <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.map((tag: string) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
