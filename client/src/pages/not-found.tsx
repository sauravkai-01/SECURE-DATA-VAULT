import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 text-destructive">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8">The secure link may have expired or never existed.</p>
      
      <Link href="/">
        <Button variant="outline" className="border-white/10">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
