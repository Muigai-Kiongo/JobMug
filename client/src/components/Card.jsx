import React, { forwardRef } from "react";
import clsx from "clsx";

/**
 * Card (shadcn-compatible)
 *
 * - Flexible card wrapper with optional header/footer slots.
 * - Styled for consistency with shadcn/ui design.
 * - Supports hover, tight padding, custom element type, and click behavior.
 */
const Card = forwardRef(function Card(
  {
    header,
    headerRight,
    footer,
    children,
    tight = false,
    hoverable = true,
    as: Component = "div",
    onClick,
    className,
    ...props
  },
  ref
) {
  const baseClasses = clsx(
    "bg-white border border-neutral-200 rounded-2xl shadow-sm transition-all",
    tight ? "p-3" : "p-5",
    hoverable && "hover:shadow-md hover:border-neutral-300",
    onClick && "cursor-pointer active:scale-[0.99]",
    className
  );

  return (
    <Component ref={ref} className={baseClasses} onClick={onClick} {...props}>
      {(header || headerRight) && (
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0 text-base font-medium">{header}</div>
          {headerRight && (
            <div className="flex-shrink-0 ml-2">{headerRight}</div>
          )}
        </div>
      )}

      <div className="min-h-0">{children}</div>

      {footer && <div className="mt-4 border-t pt-3 text-sm">{footer}</div>}
    </Component>
  );
});

export default Card;
