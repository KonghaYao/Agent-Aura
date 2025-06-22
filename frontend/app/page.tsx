"use client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import LoginPopover from "@/components/auth/LoginPopover";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
    const { isSignIn, isLoading } = useAuth();

    return (
        <main className="flex flex-col items-center justify-center min-h-screen gap-10 p-8 sm:p-20">
            <h1 className="text-3xl sm:text-5xl font-bold text-center mb-2">
                Agent Aura
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-xl mb-6">
                一个超现代的 AI Agent，能够在日常生活中给你帮助
            </p>
            <div className="flex gap-4 flex-col sm:flex-row">
                {/* 聊天按钮 */}
                {isSignIn ? (
                    <Button
                        variant="default"
                        size="lg"
                        className="rounded-md px-8 py-3 text-lg font-medium"
                        onClick={() => (window.location.href = "/chat")}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            "开始聊天"
                        )}
                    </Button>
                ) : (
                    <LoginPopover
                        trigger={
                            <Button
                                variant="default"
                                size="lg"
                                className="rounded-md px-8 py-3 text-lg font-medium"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    "登录开始"
                                )}
                            </Button>
                        }
                    />
                )}

                {/* 用户信息/登录按钮 */}
                <LoginPopover
                    trigger={
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-md px-8 py-3 text-lg font-medium"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : isSignIn ? (
                                "用户信息"
                            ) : (
                                "登录"
                            )}
                        </Button>
                    }
                />

                {/* 备忘录按钮 */}
                <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-md px-8 py-3 text-lg font-medium"
                    onClick={() => (window.location.href = "/memos")}
                >
                    备忘录
                </Button>
            </div>
        </main>
    );
}
