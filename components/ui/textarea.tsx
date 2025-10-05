import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <div
            className={cn(
                "border-input rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] h-full overflow-y-auto",
                className,
            )}
        >
            <textarea
                data-slot="textarea"
                className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content h-full w-full px-3 py-2 text-base outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                {...props}
            />
        </div>
    );
}

export { Textarea };
