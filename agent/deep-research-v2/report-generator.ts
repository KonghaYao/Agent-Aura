import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { deepSearchResult } from "./tools";

export const generateFinalReport = async (
    searchResults: z.infer<typeof deepSearchResult>[],
    lang: string,
) => {
    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });

    const prompt = `You are tasked with summarizing the raw content of a webpage retrieved from a web search. Your goal is to create a summary that preserves the most important information from the original web page. This summary will be used by a downstream research agent, so it's crucial to maintain the key details without losing essential information.

Please follow these guidelines to create your summary:

1. Identify and preserve the main topic or purpose of the webpage.
2. Retain key facts, statistics, and data points that are central to the content's message.
3. Keep important quotes from credible sources or experts.
4. Maintain the chronological order of events if the content is time-sensitive or historical.
5. Preserve any lists or step-by-step instructions if present.
6. Include relevant dates, names, and locations that are crucial to understanding the content.
7. Summarize lengthy explanations while keeping the core message intact.
8. Write the report in ${lang}.

When handling different types of content:

- For news articles: Focus on the who, what, when, where, why, and how.
- For scientific content: Preserve methodology, results, and conclusions.
- For opinion pieces: Maintain the main arguments and supporting points.
- For product pages: Keep key features, specifications, and unique selling points.

Your summary should be significantly shorter than the original content but comprehensive enough to stand alone as a source of information. Aim for about 25-30 percent of the original length, unless the content is already concise.

Present your summary in plain text format with the following structure:

**Summary**
[Your comprehensive summary here, structured with appropriate paragraphs or bullet points as needed]

**Key Excerpts**
- First important quote or excerpt
- Second important quote or excerpt
- Third important quote or excerpt
[... Add more excerpts as needed, up to a maximum of 5]

Here are two examples of good summaries:

Example 1 (for a news article):

**Summary**
On July 15, 2023, NASA successfully launched the Artemis II mission from Kennedy Space Center. This marks the first crewed mission to the Moon since Apollo 17 in 1972. The four-person crew, led by Commander Jane Smith, will orbit the Moon for 10 days before returning to Earth. This mission is a crucial step in NASA's plans to establish a permanent human presence on the Moon by 2030.

**Key Excerpts**
- "Artemis II represents a new era in space exploration," said NASA Administrator John Doe.
- "The mission will test critical systems for future long-duration stays on the Moon," explained Lead Engineer Sarah Johnson.
- "We're not just going back to the Moon, we're going forward to the Moon," Commander Jane Smith stated during the pre-launch press conference.

Example 2 (for a scientific article):

**Summary**
A new study published in Nature Climate Change reveals that global sea levels are rising faster than previously thought. Researchers analyzed satellite data from 1993 to 2022 and found that the rate of sea-level rise has accelerated by 0.08 mm/year² over the past three decades. This acceleration is primarily attributed to melting ice sheets in Greenland and Antarctica. The study projects that if current trends continue, global sea levels could rise by up to 2 meters by 2100, posing significant risks to coastal communities worldwide.

**Key Excerpts**
- "Our findings indicate a clear acceleration in sea-level rise, which has significant implications for coastal planning and adaptation strategies," lead author Dr. Emily Brown stated.
- "The rate of ice sheet melt in Greenland and Antarctica has tripled since the 1990s," the study reports.
- "Without immediate and substantial reductions in greenhouse gas emissions, we are looking at potentially catastrophic sea-level rise by the end of this century," warned co-author Professor Michael Green.

Remember, your goal is to create a summary that can be easily understood and utilized by a downstream research agent while preserving the most critical information from the original webpage.

Today's date is ${new Date().toISOString().split("T")[0]}.`;

    const response = await model.invoke([
        new SystemMessage({
            content: prompt,
        }),
        new HumanMessage({
            content: `Please generate a comprehensive final report based on the following compressed research findings:

<research_results>
${searchResults
    .map(
        (result) => `  <topic>
    <title>${result.topic}</title>
    <compressed_content>
${result.compressed_content || "No compressed content available"}
    </compressed_content>
  </topic>`,
    )
    .join("\n")}
</research_results>

Original Research Query: ${searchResults[0]?.topic || "General research"}
Date: ${new Date().toISOString().split("T")[0]}`,
        }),
    ]);

    return response.text;
};
