import React from "react";
import { useStore } from "@nanostores/react";
import { Avatar, AvatarFallback, AvatarImage, AvatarProps } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { userStore } from "../src/stores/userStore";

interface UserAvatarProps extends Omit<AvatarProps, "children"> {
    showName?: boolean;
    showEmail?: boolean;
    fallbackText?: string;
    className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    showName = true,
    showEmail = true,
    fallbackText,
    className,
    size = "default",
    ...props
}) => {
    const currentUser = useStore(userStore.user);
    const loading = useStore(userStore.isLoading);

    const initials = userStore.getInitials(currentUser);
    const displayName = userStore.getDisplayName(currentUser);

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <Avatar size={size} {...props}>
                {loading ? (
                    <AvatarFallback>
                        <div className="w-4 h-4 bg-muted-foreground/20 rounded animate-pulse" />
                    </AvatarFallback>
                ) : (
                    <>
                        <AvatarImage
                            src={
                                currentUser?.image ||
                                "https://api.dicebear.com/7.x/shapes/svg?seed=" +
                                    currentUser?.id
                            }
                            alt={displayName}
                            onError={(e) => {
                                // 如果头像加载失败，隐藏图片显示 fallback
                                (e.target as HTMLImageElement).style.display =
                                    "none";
                            }}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {fallbackText || initials}
                        </AvatarFallback>
                    </>
                )}
            </Avatar>

            {(showName || showEmail) && (
                <div className="flex flex-col min-w-0">
                    {showName && (
                        <div className="text-sm font-medium text-foreground truncate">
                            {loading ? (
                                <div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                            ) : (
                                displayName
                            )}
                        </div>
                    )}
                    {showEmail && (
                        <div className="text-xs text-muted-foreground truncate">
                            {loading ? (
                                <div className="h-3 w-24 bg-muted-foreground/20 rounded animate-pulse" />
                            ) : (
                                currentUser?.email && currentUser.email
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserAvatar;
