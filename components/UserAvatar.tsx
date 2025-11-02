import React, { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage, AvatarProps } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    name?: string;
    email?: string;
    image?: string;
}

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
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const session = await authClient.getSession();
                console.log(session);
                if (session?.data?.user) {
                    setUser(session.data.user as User);
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const getInitials = (name?: string, email?: string): string => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        if (email) {
            return email[0].toUpperCase();
        }
        return "U";
    };

    const getDisplayName = (name?: string, email?: string): string => {
        if (name) return name;
        if (email) return email.split("@")[0];
        return "用户";
    };

    const initials = getInitials(user?.name, user?.email);
    const displayName = getDisplayName(user?.name, user?.email);

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
                                user?.image ||
                                "https://api.dicebear.com/7.x/shapes/svg?seed=" +
                                    user?.id
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
                                user?.email && user.email
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserAvatar;
