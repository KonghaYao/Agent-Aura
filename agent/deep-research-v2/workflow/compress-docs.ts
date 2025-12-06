import { ChatOpenAI } from "@langchain/openai";
import {
    BaseMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages";
import PQueue from "p-queue";
import { tavily_extract } from "../../tools/tavily";
import { z } from "zod";
import { deepSearchResult } from "../state";

export const getPage = async (page_url: string) => {
    const response = await tavily_extract.invoke({ urls: [page_url] });
    return response.results[0]?.raw_content || "";
};
export const compressTopicDetails = async (
    modelName: string,
    {
        topic,
        webpages,
        lang,
        subagent_id,
    }: {
        topic: string;
        webpages: string[];
        lang: string;
        subagent_id: string;
    },
) => {
    const model = new ChatOpenAI({
        modelName,
        temperature: 0,
        metadata: {
            subagent_id,
        },
    });

    const prompt = `You are a research assistant that has conducted research on a topic by calling several tools and web searches. Your job is now to create a comprehensive summary of the findings, preserving all relevant details and sources.

<Task>
You need to process information gathered from web searches (provided as messages).
The goal is to create a dense, information-rich report that answers the research topic.
You must remove duplicate information and irrelevant fluff, BUT you must strictly preserve all specific facts, figures, dates, entities, and technical details found in the sources.
Merge conflicting information by stating "Source A says X, while Source B says Y".
</Task>

<Input Format>
The user will provide a series of messages. Each message represents a webpage and starts with:
"From [URL]
---
[Content]"

You must use the [URL] found at the beginning of each message for your citations.
</Input Format>

<Guidelines>
1. Your output should be fully comprehensive. Do not leave out any relevant details found in the sources.
2. **Citations are mandatory**. Every factual statement must be backed by an inline citation using markdown footnote syntax like [^1], [^2].
3. Include a "Sources" section at the very end, listing the URLs as footnotes.
4. If multiple sources confirm the same fact, cite all of them, e.g., [^1][^2].
5. Please output in ${lang}.
</Guidelines>

<Output Format>
The report should be structured like this:
**Fully Comprehensive Findings**
(Detailed content with inline citations)

**Sources**
(List of used sources)
</Output Format>

<Citation Rules>
- Assign each unique URL a single footnote ID (e.g., 1, 2, 3...).
- Use the standard markdown footnote syntax: \`[^id]\` for inline citations and \`[^id]: URL\` for the reference list.
- Example format:
  This is a fact[^1].
  
  [^1]: https://example.com/source1
  [^2]: https://example.com/source2
</Citation Rules>

Critical Reminder: prioritize "Information Density". Do not summarize away specific details. We want a long, detailed report, not a high-level abstract.
`;

    const response = await model.invoke([
        new SystemMessage({
            content: prompt,
        }),

        new HumanMessage({
            content: `Research Topic: ${topic}

I have conducted research on this topic using various tools and web searches. Below are the raw findings I gathered from different webpages. Each webpage content is provided as a separate message in this conversation.

My task now is to clean up and organize all this information according to the guidelines provided, preserving all relevant information while removing duplicates and irrelevant content.

Date of research: ${new Date().toISOString().split("T")[0]}.

The following messages contain the webpage content I extracted during my research process.`,
        }),
        ...webpages.map((page) => {
            return new HumanMessage({
                content: page,
            });
        }),
    ]);

    return response;
};

export const processSearchResults = async (
    modelName: string,
    searchResults: z.infer<typeof deepSearchResult>[],
    lang: string,
    subagent_id: string,
) => {
    // 1. 抓取所有网页详情
    console.log(
        "crawling details",
        searchResults.reduce((col, cur) => col + cur.useful_webpages.length, 0),
    );
    const middleMessages: BaseMessage[] = [];
    const crawlQueue = new PQueue({ concurrency: 3 });
    await crawlQueue.addAll(
        searchResults.flatMap((web, index) => {
            return web.useful_webpages.map((page_url, sub_index) => {
                return async () => {
                    const result = await getPage(page_url);
                    searchResults[index].useful_webpages[sub_index] =
                        `From ${page_url}\n\n---\n\n` + result;
                };
            });
        }),
    );
    await crawlQueue.onIdle();

    // 2. 压缩主题详情
    console.log(
        "compressing details",
        searchResults.reduce((col, cur) => col + cur.useful_webpages.length, 0),
    );
    const compressQueue = new PQueue({ concurrency: 3 });
    const compressTasks = searchResults.map((result) => {
        return async () => {
            try {
                const compressedContent = await compressTopicDetails(
                    modelName,
                    {
                        topic: result.topic,
                        webpages: result.useful_webpages,
                        lang,
                        subagent_id,
                    },
                );
                result.compressed_content = compressedContent.text;
                middleMessages.push(compressedContent);
            } catch (error) {
                console.error(
                    `Failed to compress topic "${result.topic}":`,
                    error,
                );
                result.compressed_content = `Error: Failed to compress topic "${
                    result.topic
                }". Error: ${
                    error instanceof Error ? error.message : String(error)
                }`;
            }
        };
    });

    const taskPromises = compressTasks.map((task) => compressQueue.add(task));

    try {
        await Promise.allSettled(taskPromises);
        await compressQueue.onIdle();
    } catch (error) {
        console.error("Compress queue execution failed:", error);
    }

    return { searchResults, middleMessages };
};
