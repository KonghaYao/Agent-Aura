import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { deepSearchResult } from "../state";

export const generateFinalReport = async (
    modelName: string,
    searchResults: z.infer<typeof deepSearchResult>[],
    lang: string,
) => {
    const model = new ChatOpenAI({
        modelName,
        temperature: 0,
    });

    const prompt = `You are a professional researcher and report writer.
Your task is to synthesize a comprehensive final research report based on the provided research findings.
The input contains findings from multiple research steps, each focusing on a specific sub-topic.

<Goal>
Write a concise and high-quality research report in ${lang} that answers the user's original intent.
The report should be structured, data-driven, but NOT overly long, as the user can check detailed history elsewhere.
</Goal>

<Input Format>
You will be given a list of research results within <research_results> tags.
Each result corresponds to a sub-topic and contains "compressed_content" which has verified facts and citations (e.g., [^1], [^2]).
</Input Format>

<Guidelines>
1. **Synthesis**: Synthesize the findings into a logical narrative. Group related information together.
2. **Citations**: You MUST preserve the original citation IDs (e.g., [^1], [^5]) when you use the information.
   - If you combine info from source [^1] and [^2], cite them as [^1][^2].
   - Do not re-number citations. Keep the original IDs from the input text so they match the reference list.
3. **Conciseness**: The user wants a clear, direct answer. Avoid fluff. Focus on the most important facts, figures, and conclusions.
4. **Structure**:
   - **Summary**: A direct answer to the query.
   - **Key Findings**: The most important data points and insights, organized by themes.
   - **Conclusion**: Final thoughts.
5. **Language**: Write the report in ${lang}.
6. **Tone**: Professional, objective, and analytical.
</Guidelines>

<Output Format>
# Title of the Report

## Summary
...

## Key Findings
...

## Conclusion
...

(Note: The system will append the full list of sources at the bottom, so you only need to ensure inline citations like [^1] are preserved in the text.)
`;

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
