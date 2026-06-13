import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "compact" | "error";
}

const DEFAULT_ICON = (
  <svg
    className="h-8 w-8"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export function EmptyState({
  title = "No data found",
  description = "There are no items to display at the moment.",
  icon,
  action,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "default" && "py-16 px-6",
        variant === "compact" && "py-10 px-4",
        variant === "error" && "py-16 px-6"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl mb-5",
          variant === "error"
            ? "h-16 w-16 bg-destructive/10 text-destructive"
            : icon
              ? "h-16 w-16 bg-gradient-to-br from-primary/10 to-primary/5 [&>*]:scale-125"
              : "h-16 w-16 bg-gradient-to-br from-primary/10 to-primary/5 text-primary [&>*]:scale-125"
        )}
      >
        {icon || DEFAULT_ICON}
      </div>
      <h3 className="text-lg font-semibold font-heading mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <Button variant="premium" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
