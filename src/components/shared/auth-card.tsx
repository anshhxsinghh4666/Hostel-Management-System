import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card variant="elevated" className="w-full border-0 shadow-elevated">
      <CardHeader className="space-y-2 pb-6">
        <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md mb-2">
          <span className="text-white text-xl font-bold">H</span>
        </div>
        <CardTitle className="text-2xl font-bold text-center font-heading">{title}</CardTitle>
        {description && (
          <CardDescription className="text-center text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
