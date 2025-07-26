import { BaseMessage } from "@langchain/core/messages";

export function getResearchTopic(messages: BaseMessage[]): string {
    // 从消息中提取研究主题
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.content?.toString() || "未知研究主题";
}

export function getCitations(response: any, resolvedUrls: any[]): any[] {
    // 模拟获取引用信息
    // 这里需要根据实际的Google Gemini API响应格式来实现
    return resolvedUrls.map((url, index) => ({
        segments: [url],
        citation_index: index,
    }));
}

export function insertCitationMarkers(text: string, citations: any[]): string {
    // 在文本中插入引用标记
    let modifiedText = text;
    citations.forEach((citation, index) => {
        // 这里可以添加更复杂的引用插入逻辑
        modifiedText += ` [${index + 1}]`;
    });
    return modifiedText;
}

export function resolveUrls(groundingChunks: any[], id: number): any[] {
    // 解析URL为短URL格式
    if (!groundingChunks) return [];

    return groundingChunks.map((chunk: any, index: number) => ({
        value: chunk.web?.uri || `https://example.com/${id}-${index}`,
        short_url: `[${id}-${index}]`,
        segments: chunk.web ? [chunk.web] : [],
    }));
}
