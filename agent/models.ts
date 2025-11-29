export const defaultModelsAllowed = [
    {
        provider: "openai",
        model: "grok-4-fast",
    },
    {
        provider: "openai",
        model: "x-ai/grok-4.1-fast:free",
    },
    {
        provider: "openai",
        model: "grok-code-fast-1",
    },
    {
        provider: "openai",
        model: "gemini-2.5-flash",
    },
    {
        provider: "openai",
        model: "gemini-3-pro-image-preview",
    },
    {
        provider: "openai",
        model: "gemini-2.5-flash-image",
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
export const models = {
    main_model: defaultModelsAllowed.map((m) => m.model),
    reasoning_model: ["o4-mini"],
};
