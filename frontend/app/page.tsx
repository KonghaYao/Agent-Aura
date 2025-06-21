"use client";
export default function Home() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen gap-10 p-8 sm:p-20">
            <h1 className="text-3xl sm:text-5xl font-bold text-center mb-2">
                Agent Aura
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-xl mb-6">
                一个超现代的 AI Agent，能够在日常生活中给你帮助
            </p>
            <div className="flex gap-4 flex-col sm:flex-row">
                <a
                    href="/chat"
                    className="rounded-md bg-primary text-primary-foreground px-8 py-3 text-lg font-medium shadow hover:bg-primary/90 transition-colors"
                >
                    开始聊天
                </a>
                <a
                    href="/memos"
                    className="rounded-md bg-blue-500 text-white px-8 py-3 text-lg font-medium shadow hover:bg-blue-600 transition-colors"
                >
                    备忘录
                </a>
            </div>
        </main>
    );
}
