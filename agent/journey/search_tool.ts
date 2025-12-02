import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { JourneyStore } from "./JourneyStore";

/**
 * Creates a LangChain tool for searching and retrieving Journeys.
 * This tool combines getByTitle and search functionality.
 * If an exact title match is found, it returns that journey's prompt.
 * Otherwise, it performs a search and returns the prompts of matching journeys.
 */
export function createJourneySearchTool(store: JourneyStore) {
    return tool(
        async ({
            query,
            type,
        }: {
            query: string;
            type: "exact" | "search";
        }) => {
            // 1. Try exact match first if type is exact or unspecified
            if (type === "exact") {
                const exactMatch = store.getByTitle(query);
                if (exactMatch) {
                    return exactMatch.toPrompt();
                }
                return "No journey found with that exact title.";
            }

            // 2. Perform search
            // Default to searching title and description
            const results = store.search(query, ["title", "description"]);

            if (results.length === 0) {
                return "No journeys found matching the query.";
            }

            // 3. Return formatted results
            // If only one result, return its full prompt
            if (results.length === 1) {
                return `Found 1 journey:\n\n${results[0].toPrompt()}`;
            }

            // If multiple results, return a summary list to avoid token overflow
            // Or return full prompts if they are short enough?
            // For now, let's return titles and descriptions of matches to let the agent decide
            // if it needs to ask for a specific one (or we could just concat all prompts if not too many)

            const summaries = results
                .map((j) => `Title: ${j.title}\nDescription: ${j.description}`)
                .join("\n---\n");

            return `Found ${results.length} matching journeys. Please refine your search or request a specific title:\n\n${summaries}`;
        },
        {
            name: "get_journey",
            description:
                "Search for existing user journeys by title or content. Returns the XML definition of the journey if found.",
            schema: z.object({
                query: z
                    .string()
                    .describe("The search query or exact title of the journey"),
                type: z
                    .enum(["exact", "search"])
                    .optional()
                    .default("search")
                    .describe(
                        "Search type: 'exact' looks for exact title match, 'search' looks in title and description",
                    ),
            }),
        },
    );
}
