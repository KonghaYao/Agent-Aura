export const imageRecognitionPrompts = [
    {
        label: "提取图片中的文字",
        value: "extract-text",
        prompt: "请提取图片中所有的内容，严格按照原始的格式，以 Markdown 形式输出。如果涉及到文本的大小，则需要按照大小选择 H 层级进行整理。可以忽略一些不重要的广告，按钮内容，保证数据的优雅性。如果涉及到左右排版，则可以根据阅读顺序进行抽取，着重考虑可读性信息的抽取。",
    },
    {
        label: "描述图片内容",
        value: "describe-image",
        prompt: "请详细描述图片中的内容，包括场景、人物、物体、颜色等。",
    },
    {
        label: "抽取图片中的数据",
        value: "extract-json",
        prompt: "请抽取图片中的数据，并以 json 返回, 键为数据的名称，值为数据的值。如果遇到表格，尽量以数组形式返回。",
    },
    {
        label: "自定义提示词",
        value: "custom",
        prompt: "",
    },
];

export type ImageRecognitionPrompt = (typeof imageRecognitionPrompts)[number];
