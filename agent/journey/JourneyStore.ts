import { Journey } from "./Journey";

export type SearchField = "title" | "description" | "prompt";

export class JourneyStore {
    private journeys: Journey[] = [];

    create(title: string, description: string, conditions: string[]): Journey {
        const journey = new Journey({ title, description, conditions });
        this.journeys.push(journey);
        return journey;
    }

    /**
     * Get all journeys
     */
    getAll(): Journey[] {
        return this.journeys;
    }
    getSamplePrompt() {
        const summaries = this.journeys
            .map((i) => {
                return `<journey_summary>
    <title>${i.title}</title>
    <description>${i.description}</description>
    <when_to_use>${i.conditions.join(", ")}</when_to_use>
</journey_summary>`;
            })
            .join("\n");

        return `[Journey System Context]
A Journey is a strategic, long-term plan designed to achieve complex user goals.

[Tool Usage Context]
- **get_journey**: Use this tool to retrieve journey details by title or search for journeys using keywords.

[Available Journeys Context]
Review the summaries below to see if any journey matches the current user request:
${summaries}`;
    }

    /**
     * Get a journey by its exact title
     */
    getByTitle(title: string): Journey | undefined {
        return this.journeys.find((j) => j.title === title);
    }

    /**
     * Search journeys by query string across specified fields
     * @param query The search text
     * @param fields Fields to search in (defaults to title and description)
     */
    search(
        query: string,
        fields: SearchField[] = ["title", "description"],
    ): Journey[] {
        const lowerQuery = query.toLowerCase();
        return this.journeys.filter((journey) => {
            return fields.some((field) => {
                if (field === "prompt") {
                    const prompt = journey.toPrompt();
                    return prompt && prompt.toLowerCase().includes(lowerQuery);
                }
                const value = journey[field];
                return value && value.toLowerCase().includes(lowerQuery);
            });
        });
    }
}
