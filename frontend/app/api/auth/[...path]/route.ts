import { NextRequest } from "next/server";

// 处理 GET 请求
export async function GET(request: NextRequest) {
    return handleStreamRequest(request, "GET");
}

// 处理 POST 请求
export async function POST(request: NextRequest) {
    return handleStreamRequest(request, "POST");
}

export async function DELETE(request: NextRequest) {
    return handleStreamRequest(request, "DELETE");
}

export async function PUT(request: NextRequest) {
    return handleStreamRequest(request, "PUT");
}

export async function PATCH(request: NextRequest) {
    return handleStreamRequest(request, "PATCH");
}

/**
 * 处理流式 API 代理请求的通用函数
 */
async function handleStreamRequest(req: NextRequest, method: string) {
    const url =
        "https://auth-center.deno.dev" +
        req.nextUrl.pathname.replace("/api", "");
    const response = await fetch(url, {
        method: method,
        headers: {
            cookie: req.headers.get("cookie") || "",
        },
        body: req.body,
        redirect: "manual",
    });
    return new Response(response.body, {
        headers: {
            location: response.headers.get("location") || "",
            "set-cookie": response.headers.get("set-cookie") || "",
            "content-type": response.headers.get("content-type") || "",
            "cache-control": response.headers.get("cache-control") || "",
            "content-length": response.headers.get("content-length") || "",
            date: response.headers.get("date") || "",
            expires: response.headers.get("expires") || "",
            pragma: response.headers.get("pragma") || "",
            server: response.headers.get("server") || "",
            status: response.headers.get("status") || "",
        },
        status: response.status,
    });
}
