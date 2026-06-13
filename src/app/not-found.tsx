import Link from "next/link";
import { GraduationCap, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-mesh p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-lg font-heading">HostelMS</span>
      </div>
      <div className="flex flex-col items-center gap-4 text-center animate-fade-up">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span className="text-4xl font-bold text-gradient">404</span>
        </div>
        <h1 className="text-2xl font-bold font-heading">Page Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link href="/login">
        <Button variant="premium">
          <Home className="mr-2 h-4 w-4" />
          Go to Home
        </Button>
      </Link>
    </div>
  );
}
