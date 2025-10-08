import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({
    className,
    resize = "none",
    onKeyDown,
    ...props
}: React.ComponentProps<"textarea"> & {
    resize?: "none" | "vertical" | "horizontal";
}) {
    const [isComposing, setIsComposing] = React.useState(false);

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = () => {
        setIsComposing(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // 在中文输入法组合状态下，按 Enter 键不应该触发其他行为（如发送消息）
        if (isComposing && event.key === "Enter") {
            return; // 不阻止默认行为，让输入法处理 Enter 键
        }

        // 调用传入的 onKeyDown 回调
        onKeyDown?.(event);
    };

    return (
        <div
            className={cn(
                "border-input rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] h-full overflow-y-auto",
                className,
            )}
        >
            <textarea
                data-slot="textarea"
                className={cn(
                    "placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content h-full w-full px-3 py-2 text-base outline-none focus-visible:ring-0 focus-visible:border-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    resize === "none" && "resize-none",
                    resize === "vertical" && "resize-vertical",
                    resize === "horizontal" && "resize-horizontal",
                )}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onKeyDown={handleKeyDown}
                {...props}
            />
        </div>
    );
}

export { Textarea };
