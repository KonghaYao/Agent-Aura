export class ChatResponse {
    private baseUrl: string;
    private model: string;
    private defaultHeader: Record<string, string>;
    constructor(
        model: string,
        baseUrl: string = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL!,
        options: {
            defaultHeader?: Record<string, string>;
        } = {},
    ) {
        this.baseUrl = baseUrl;
        this.model = model;
        this.defaultHeader = options.defaultHeader ?? {};
    }
    /**
     * @example
     * const chat = new ChatResponse();
     * const response = chat.response("Hello, how are you?");
     * for await (const chunk of response) {
     *     console.log(chunk);
     * }
     */
    async *response(prompt: string) {
        const response = await fetch(this.baseUrl + "/llm/response", {
            method: "POST",
            body: JSON.stringify({ prompt, model: this.model }),
            headers: this.defaultHeader,
        });
        if (!response.body) return;
        const reader = response.body
            .pipeThrough(new TextDecoderStream())
            .getReader();
        let result = await reader.read();
        for (; !result.done; result = await reader.read()) {
            if (result.value) yield result.value;
        }
        reader.releaseLock();
    }

    /**
     * @example
     * const response = useChatTool().structuredResponse("Hello, how are you?", {
     *     name: "string",
     *     age: "number",
     * });
     */
    async structuredResponse(prompt: string, schema: any) {
        const response = await fetch(
            this.baseUrl + "/llm/structured-response",
            {
                method: "POST",
                body: JSON.stringify({ prompt, schema, model: this.model }),
                headers: this.defaultHeader,
            },
        );
        return response.json();
    }
}
