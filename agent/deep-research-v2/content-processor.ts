import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import PQueue from "p-queue";
import { tavily_extract } from "../tools/tavily";
import { z } from "zod";
import { deepSearchResult } from "./tools";

export const getPage = async (page_url: string) => {
    const response = await tavily_extract.invoke({ urls: [page_url] });
    return response.results[0]?.raw_content || "";
};

export const compressTopicDetails = async (
    topic: string,
    webpages: string[],
    lang: string,
) => {
    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });

    const prompt = `You are a research assistant that has conducted research on a topic by calling several tools and web searches. Your job is now to clean up the findings, but preserve all of the relevant statements and information that the researcher has gathered. 

<Task>
You need to clean up information gathered from tool calls and web searches in the existing messages.
All relevant information should be repeated and rewritten verbatim, but in a cleaner format.
The purpose of this step is just to remove any obviously irrelevant or duplicative information.
For example, if three sources all say "X", you could say "These three sources all stated X".
Only these fully comprehensive cleaned findings are going to be returned to the user, so it's crucial that you don't lose any information from the raw messages.
</Task>

<Guidelines>
1. Your output findings should be fully comprehensive and include ALL of the information and sources that the researcher has gathered from tool calls and web searches. It is expected that you repeat key information verbatim.
2. This report can be as long as necessary to return ALL of the information that the researcher has gathered.
3. In your report, you should return inline citations for each source that the researcher found.
4. You should include a "Sources" section at the end of the report that lists all of the sources the researcher found with corresponding citations, cited against statements in the report.
5. Make sure to include ALL of the sources that the researcher gathered in the report, and how they were used to answer the question!
6. It's really important not to lose any sources. A later LLM will be used to merge this report with others, so having all of the sources is critical.
7. Please output in ${lang}.
</Guidelines>

<Output Format>
The report should be structured like this:
**List of Queries and Tool Calls Made**
**Fully Comprehensive Findings**
**List of All Relevant Sources (with citations in the report)**
</Output Format>

<Citation Rules>
- Assign each unique URL a single citation number in your text
- End with ### Sources that lists each source with corresponding numbers
- IMPORTANT: Number sources sequentially without gaps (1,2,3,4...) in the final list regardless of which sources you choose
- Example format:
  [1] Source Title: URL
  [2] Source Title: URL
</Citation Rules>

Critical Reminder: It is extremely important that any information that is even remotely relevant to the user's research topic is preserved verbatim (e.g. don't rewrite it, don't summarize it, don't paraphrase it).
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

    return response.text;
};

export const processSearchResults = async (
    searchResults: z.infer<typeof deepSearchResult>[],
    lang: string,
) => {
    // 1. 抓取所有网页详情
    console.log(
        "crawling details",
        searchResults.reduce((col, cur) => col + cur.useful_webpages.length, 0),
    );
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
    const compressTasks = searchResults.map((result, index) => {
        return async () => {
            try {
                const compressedContent = await compressTopicDetails(
                    result.topic,
                    result.useful_webpages,
                    lang,
                );
                searchResults[index].compressed_content = compressedContent;
            } catch (error) {
                console.error(
                    `Failed to compress topic "${result.topic}":`,
                    error,
                );
                searchResults[index].compressed_content = `Error: Failed to compress topic "${
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

    return searchResults;
};

