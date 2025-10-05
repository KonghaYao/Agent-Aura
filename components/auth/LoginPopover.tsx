"use client";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface LoginPopoverProps {
    trigger?: React.ReactNode;
}

const LoginPopover = ({ trigger }: LoginPopoverProps) => {
    const { isSignIn, userInfo, isLoading, signOut } = useAuth();

    return (
        <Popover>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isSignIn ? (
                            "用户信息"
                        ) : (
                            "登录"
                        )}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex flex-col items-center gap-4 py-2">
                    <h3 className="text-lg font-semibold">
                        {isSignIn ? "用户信息" : "登录到 Agent Aura"}
                    </h3>

                    {isSignIn ? (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {userInfo?.picture ? (
                                    <img
                                        src={userInfo.picture}
                                        alt={userInfo?.name || "用户头像"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xl font-semibold">
                                        {(userInfo?.name || "User")
                                            .substring(0, 2)
                                            .toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="text-center">
                                <h3 className="font-medium text-lg">
                                    {userInfo?.name || "用户"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {userInfo?.email || ""}
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                className="w-full mt-2"
                                onClick={signOut}
                            >
                                退出登录
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 w-full">
                            <p className="text-center text-muted-foreground">
                                登录后可以保存您的聊天记录和个人设置
                            </p>
                            <Button
                                className="w-full"
                                onClick={() =>
                                    (window.location.href = "/api/auth/sign-in")
                                }
                            >
                                登录
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                    (window.location.href = "/api/auth/sign-up")
                                }
                            >
                                注册新账号
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default LoginPopover;
