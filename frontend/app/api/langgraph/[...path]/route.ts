import { NextRequest } from "next/server";

// 处理 GET 请求
export async function GET(request: NextRequest) {
    return handleStreamRequest(request, "GET");
}

// 处理 POST 请求
export async function POST(request: NextRequest) {
    console.log("POST", request.url);
    return handleStreamRequest(request, "POST");
}

/**
 * 处理流式 API 代理请求的通用函数
 */
async function handleStreamRequest(request: NextRequest, method: string) {
    // 构建目标 URL
    const url = new URL(request.url);
    const targetUrl = new URL(
        url.pathname.replace("/api/langgraph", ""),
        process.env.LANGGRAPH_API_URL,
    );
    targetUrl.search = url.search;
    // console.log(targetUrl.toString());
    // console.log(request.body);
    // 准备请求选项
    const fetchOptions: RequestInit = {
        method,
        headers: request.headers,
        // 添加 duplex 选项，解决 body 传输问题
        // @ts-ignore - TypeScript 类型定义中可能缺少此属性
        duplex: "half",
        body: request.body,
    };

    // 发送请求到目标 API
    const response = await fetch(targetUrl.toString(), fetchOptions);
    const headers = response.headers;
    return new Response(response.body, {
        headers: {
            "Content-Type": headers.get("Content-Type") || "",
        },
    });
}
