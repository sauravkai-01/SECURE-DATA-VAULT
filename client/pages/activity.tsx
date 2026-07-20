import { useQuery } from "@tanstack/react-query";
import { AuditLog } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Activity as ActivityIcon, Shield, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Activity() {
  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "REGISTER": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">ACCOUNT_CREATED</Badge>;
      case "LOGIN": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">AUTH_SUCCESS</Badge>;
      case "UPLOAD": return <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-bold">VAULT_INGEST</Badge>;
      case "DELETE": return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold">SECURE_SHRED</Badge>;
      case "ACCESS_SHARED": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">EXT_ACCESS</Badge>;
      case "ANALYZE": return <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 font-bold">AI_NEURAL_SCAN</Badge>;
      default: return <Badge variant="outline" className="font-bold uppercase text-[10px]">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-black text-foreground mb-2 flex items-center gap-3">
          <ActivityIcon className="w-10 h-10 text-primary" />
          Neural Logs
        </h1>
        <p className="text-muted-foreground">Monitor all security-related actions and data access events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Health</CardTitle>
            <Shield className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Excellent</div>
            <p className="text-xs text-muted-foreground">All systems monitoring active</p>
          </CardContent>
        </Card>
         <Card className="glass-card border-black/5 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Global Intel</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">4 Regions</div>
            <p className="text-xs text-muted-foreground font-medium">Access detected across 12 IP nodes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-white/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="hidden md:table-cell">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full bg-white/5" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20 bg-white/5" /></TableCell>
                  </TableRow>
                ))
              ) : (
                logs?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((log) => (
                  <TableRow key={log.id} className="hover:bg-white/5 border-white/5 transition-colors">
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.details}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {log.ipAddress}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
