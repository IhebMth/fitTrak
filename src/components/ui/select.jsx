import React from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </div>
));

const SelectContent = React.forwardRef(({ className, children,  ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <option
    ref={ref}
    className={cn(
      "relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-blue-50",
      className
    )}
    {...props}
  >
    {children}
  </option>
));

const SelectValue = React.forwardRef(({ className, children, ...props }, ref) => (
  <span ref={ref} className={cn("block truncate", className)} {...props}>
    {children}
  </span>
));

Select.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  defaultValue: PropTypes.any,
  value: PropTypes.any,
  onValueChange: PropTypes.func,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  required: PropTypes.bool
};

SelectTrigger.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  "aria-label": PropTypes.string
};

SelectContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(["popper", "item"]),
  side: PropTypes.oneOf(["top", "right", "bottom", "left"]),
  align: PropTypes.oneOf(["start", "center", "end"])
};

SelectItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  textValue: PropTypes.string
};

SelectValue.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  placeholder: PropTypes.string
};

Select.displayName = "Select";
SelectTrigger.displayName = "SelectTrigger";
SelectContent.displayName = "SelectContent";
SelectItem.displayName = "SelectItem";
SelectValue.displayName = "SelectValue";

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };