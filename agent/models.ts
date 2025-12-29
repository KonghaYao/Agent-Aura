export const defaultModelsAllowed = [
    {
        provider: "openai",
        model: "mino-v2-flash",
    },
    {
        provider: "openai",
        model: "glm-4.7",
    },
    {
        provider: "openai",
        model: "kimi-k2-0905",
    },
    {
        provider: "openai",
        model: "grok-4-1-fast",
    },
    {
        provider: "openai",
        model: "grok-code-fast",
    },
    {
        provider: "openai",
        model: "gemini-3-flash-preview",
    },
    {
        provider: "openai",
        model: "gemini-2.0-flash",
    },
    {
        provider: "openai",
        model: "gpt-5-nano",
    },
    {
        provider: "openai",
        model: "gpt-4o-mini",
    },
    {
        provider: "openai",
        model: "deepseek-chat",
    },
];
export const models = {
    main_model: defaultModelsAllowed.map((m) => m.model),
    reasoning_model: ["o4-mini"],
};
