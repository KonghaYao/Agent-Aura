import { getUserToken } from "@/app/chat/context/ChatContext";
import { Memo, SearchResult } from "../types";

const BASE_URL = `${process.env.NEXT_PUBLIC_LANGGRAPH_API_URL}/memory`;

export async function getMemo(key: string): Promise<Memo> {
    const response = await fetch(`${BASE_URL}/use/${key}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${getUserToken()}`,
        },
    });

    if (!response.ok) {
        throw new Error("获取备忘录失败");
    }

    const data = await response.json();
    return { key, text: data.text };
}

export async function searchMemos(
    query: string = "",
    limit: number = 50,
): Promise<Memo[]> {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (limit) params.append("limit", limit.toString());

    const response = await fetch(`${BASE_URL}/search?${params.toString()}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${getUserToken()}`,
        },
    });

    if (!response.ok) {
        throw new Error("搜索备忘录失败");
    }

    const data: SearchResult = await response.json();
    return data.results;
}

export async function createMemo(key: string, value: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/use/${key}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getUserToken()}`,
        },
        body: JSON.stringify({ value }),
    });

    if (!response.ok) {
        throw new Error("创建备忘录失败");
    }
}

export async function updateMemo(key: string, value: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/use/${key}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getUserToken()}`,
        },
        body: JSON.stringify({ value }),
    });

    if (!response.ok) {
        throw new Error("更新备忘录失败");
    }
}

export async function deleteMemo(key: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/use/${key}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${getUserToken()}`,
        },
    });

    if (!response.ok) {
        throw new Error("删除备忘录失败");
    }
}
