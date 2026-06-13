import { cn } from "@/lib/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer" | "card" | "text";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        variant === "default" && "animate-pulse",
        variant === "shimmer" &&
          "animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/10 to-muted",
        variant === "card" && "animate-pulse h-32 rounded-xl",
        variant === "text" && "animate-pulse h-4 w-full",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
