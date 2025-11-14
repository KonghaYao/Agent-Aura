/** @deprecated */
export const models = {
    main_model: [
        "x-ai/grok-4-fast",
        "x-ai/grok-code-fast-1",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gpt-5",
        "gemini-2.5-pro",
        "glm-4.6",
        "claude-4-5",
        "gpt-4.1",
        "gpt-4.1-mini",
        "gpt-4o-mini",
        "qwen-plus",
    ],
    reasoning_model: ["o4-mini"],
};

export const defaultModelsAllowed = [
    {
        provider: "openai",
        model: "x-ai/grok-4-fast",
    },
    {
        provider: "openai",
        model: "x-ai/grok-code-fast-1",
    },
    {
        provider: "openai",
        model: "glm-4.6",
    },
    {
        provider: "openai",
        model: "gemini-2.5-flash",
    },
    {
        provider: "openai",
        model: "gemini-2.0-flash",
    },
    {
        provider: "openai",
        model: "gpt-5",
    },

    {
        provider: "openai",
        model: "claude-4-5",
    },
    {
        provider: "openai",
        model: "gpt-4.1",
    },
    {
        provider: "openai",
        model: "gpt-4.1-mini",
    },
    {
        provider: "openai",
        model: "gpt-4o-mini",
    },
    {
        provider: "openai",
        model: "qwen-plus",
    },
];
