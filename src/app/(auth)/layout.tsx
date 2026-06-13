import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh-auth p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.015] pointer-events-none" />
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-lg font-heading">HostelMS</span>
      </div>
      <div className="w-full max-w-md animate-fade-up">
        {children}
      </div>
    </div>
  );
}
