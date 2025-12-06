import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

export function AuthForm({ className, ...props }: React.ComponentProps<"div">) {
    const [mode, setMode] = useState<AuthMode>("login");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationEmail, setVerificationEmail] = useState<string | null>(
        null,
    );

    const isLogin = mode === "login";

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setError(null); // 切换模式时清除错误
        setVerificationEmail(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            if (isLogin) {
                // 登录
                await authClient.signIn.email(
                    {
                        email,
                        password,
                        callbackURL: new URL(
                            "/agent",
                            globalThis.location.href,
                        ).toString(),
                    },
                    {
                        onSuccess: () => {
                            toast.success("登录成功，正在跳转...");
                            setTimeout(() => {
                                // 使用 JS 指令跳转
                                window.location.href = "/agent";
                            }, 300);
                        },
                        onError: (ctx) => {
                            // Handle the error
                            if (ctx.error.status === 403) {
                                toast.error("请验证您的邮箱地址");
                                setVerificationEmail(email);
                            } else {
                                toast.error(
                                    ctx.error.message ||
                                        "登录失败，请检查邮箱和密码",
                                );
                            }
                        },
                    },
                );
            } else {
                // 注册
                const confirmPassword = formData.get(
                    "confirm-password",
                ) as string;

                if (password !== confirmPassword) {
                    toast.error("两次输入的密码不一致");
                    return;
                }

                await authClient.signUp.email(
                    {
                        email,
                        password,
                        name: email.split("@")[0], // 使用邮箱前缀作为默认名称
                    },
                    {
                        onSuccess: () => {
                            toast.success("注册成功！请检查您的邮箱并验证账户");
                            // 切换到登录模式
                            switchMode("login");
                        },
                        onError: (ctx) => {
                            if (ctx.error.status === 422) {
                                toast.error("该邮箱已被注册，请直接登录");
                                switchMode("login");
                            } else {
                                toast.error(
                                    ctx.error.message || "注册失败，请重试",
                                );
                            }
                        },
                    },
                );
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "发生错误，请重试",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!verificationEmail) return;
        setIsLoading(true);
        try {
            await authClient.sendVerificationEmail(
                {
                    email: verificationEmail,
                    callbackURL: new URL(
                        "/agent",
                        globalThis.location.href,
                    ).toString(),
                },
                {
                    onSuccess: () => {
                        toast.success("验证邮件已发送，请检查您的邮箱");
                    },
                    onError: (ctx) => {
                        toast.error(ctx.error.message || "发送失败，请重试");
                    },
                },
            );
        } catch (err) {
            toast.error("发送失败，请重试");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={cn("flex flex-col gap-6 min-w-2xl ", className)}
            {...props}
        >
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">
                                    {isLogin
                                        ? "Welcome back"
                                        : "Create your account"}
                                </h1>
                                <p className="text-muted-foreground text-sm text-balance">
                                    {isLogin
                                        ? "Login to your Acme Inc account"
                                        : "Enter your email below to create your account"}
                                </p>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                />
                                {!isLogin && (
                                    <FieldDescription>
                                        We&apos;ll use this to contact you. We
                                        will not share your email with anyone
                                        else.
                                    </FieldDescription>
                                )}
                            </Field>
                            {!isLogin && (
                                <Field>
                                    <Field className="grid grid-cols-2 gap-4">
                                        <Field>
                                            <FieldLabel htmlFor="password">
                                                Password
                                            </FieldLabel>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                required
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="confirm-password">
                                                Confirm Password
                                            </FieldLabel>
                                            <Input
                                                id="confirm-password"
                                                name="confirm-password"
                                                type="password"
                                                required
                                            />
                                        </Field>
                                    </Field>
                                    <FieldDescription>
                                        Must be at least 8 characters long.
                                    </FieldDescription>
                                </Field>
                            )}
                            {isLogin && (
                                <Field>
                                    <div className="flex items-center">
                                        <FieldLabel htmlFor="password">
                                            Password
                                        </FieldLabel>
                                        <a
                                            href="#"
                                            className="ml-auto text-sm underline-offset-2 hover:underline"
                                        >
                                            Forgot your password?
                                        </a>
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                    />
                                </Field>
                            )}
                            {error && (
                                <FieldDescription className="text-red-500 text-center">
                                    {error}
                                </FieldDescription>
                            )}
                            <Field>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading
                                        ? "Loading..."
                                        : isLogin
                                        ? "Login"
                                        : "Create Account"}
                                </Button>
                            </Field>
                            {verificationEmail && (
                                <Field>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResendVerification}
                                        disabled={isLoading}
                                        className="w-full"
                                    >
                                        重发验证邮件
                                    </Button>
                                </Field>
                            )}
                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                Or continue with
                            </FieldSeparator>
                            <FieldDescription className="text-center">
                                {isLogin ? (
                                    <>
                                        Don&apos;t have an account?{" "}
                                        <button
                                            type="button"
                                            onClick={() => switchMode("signup")}
                                            className="underline underline-offset-4 hover:text-primary"
                                        >
                                            Sign up
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <button
                                            type="button"
                                            onClick={() => switchMode("login")}
                                            className="underline underline-offset-4 hover:text-primary"
                                        >
                                            Sign in
                                        </button>
                                    </>
                                )}
                            </FieldDescription>
                        </FieldGroup>
                    </form>
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop&crop=center"
                            alt="AI Technology Background"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
