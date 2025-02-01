import React from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const Alert = React.forwardRef(({ className, variant = "default", children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        {
          "bg-background text-foreground": variant === "default",
          "border-destructive/50 text-destructive dark:border-destructive": variant === "destructive",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Alert.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "destructive"]),
  children: PropTypes.node,
};

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-1 text-sm leading-relaxed opacity-90", className)}
    {...props}
  />
));

AlertDescription.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

Alert.displayName = "Alert";
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };
