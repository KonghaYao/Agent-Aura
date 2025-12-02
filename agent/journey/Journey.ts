export type StateType = "initial" | "chat" | "tool";

export interface JourneyOptions {
    title: string;
    conditions?: string[];
    description?: string;
}

export interface TransitionOptions {
    chatState?: string;
    toolState?: any;
    condition?: string;
    state?: JourneyState;
}

export interface JourneyTransition {
    source: JourneyState;
    target: JourneyState;
    condition?: string;
}

export interface JourneyState {
    id: string;
    type: StateType;
    name: string;
}

export abstract class BaseJourney {
    public title: string;
    public conditions: string[];
    public description: string;

    public states: JourneyState[] = [];
    public transitions: JourneyTransition[] = [];

    protected promptCache: string | null = null;

    constructor(options: JourneyOptions) {
        this.title = options.title;
        this.conditions = options.conditions || [];
        this.description = options.description || "";
    }

    /**
     * Converts the journey to an XML representation.
     * Results are cached until the journey is modified.
     */
    toPrompt(): string {
        if (this.promptCache) {
            return this.promptCache;
        }

        const parts: string[] = [];
        parts.push(`<journey title="${this.title}">`);

        if (this.description) {
            parts.push(`  <description>${this.description}</description>`);
        }

        if (this.conditions.length > 0) {
            parts.push(`  <conditions>`);
            this.conditions.forEach((c) =>
                parts.push(`    <condition>${c}</condition>`),
            );
            parts.push(`  </conditions>`);
        }

        parts.push(`  <states>`);
        this.states.forEach((s) => {
            // Simple escaping for attributes could be added if needed,
            // but for now assuming reasonable input or basic usage.
            parts.push(
                `    <state id="${s.id}" type="${s.type}" name="${s.name}" />`,
            );
        });
        parts.push(`  </states>`);

        parts.push(`  <transitions>`);
        this.transitions.forEach((t) => {
            const cond = t.condition ? ` condition="${t.condition}"` : "";
            parts.push(
                `    <transition source="${t.source.id}" target="${t.target.id}"${cond} />`,
            );
        });
        parts.push(`  </transitions>`);

        parts.push(`</journey>`);

        this.promptCache = parts.join("\n");
        return this.promptCache;
    }

    /**
     * Generates a Mermaid flowchart definition for the journey.
     */
    draw(): string {
        const lines: string[] = ["flowchart TD"];

        // Define styles
        lines.push(
            "    classDef chat fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000;",
        );
        lines.push(
            "    classDef tool fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000,shape:rect;",
        );
        lines.push(
            "    classDef initial fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000,shape:circle;",
        );

        // Add nodes
        this.states.forEach((state) => {
            const safeName = state.name.replace(/"/g, "'");
            let nodeDef = "";

            switch (state.type) {
                case "initial":
                    nodeDef = `    ${state.id}(("${safeName}")):::initial`;
                    break;
                case "tool":
                    nodeDef = `    ${state.id}[["${safeName}"]]:::tool`;
                    break;
                case "chat":
                default:
                    nodeDef = `    ${state.id}("${safeName}"):::chat`;
                    break;
            }
            lines.push(nodeDef);
        });

        lines.push(""); // Spacer

        // Add transitions
        this.transitions.forEach((t) => {
            const conditionLabel = t.condition
                ? `-- "${t.condition}" -->`
                : "-->";
            lines.push(`    ${t.source.id} ${conditionLabel} ${t.target.id}`);
        });

        return lines.join("\n");
    }
}

export class Journey extends BaseJourney {
    public initialState: JourneyState;
    private stateCounter = 0;

    constructor(options: JourneyOptions) {
        super(options);
        this.initialState = this.createState("initial", "Start");
    }

    createState(type: StateType, name: string): JourneyState {
        this.promptCache = null; // Invalidate cache
        const id = `node_${this.stateCounter++}`;
        const state: JourneyState = { id, type, name };
        this.states.push(state);
        return state;
    }

    addTransition(transition: JourneyTransition) {
        this.promptCache = null; // Invalidate cache
        this.transitions.push(transition);
    }

    /**
     * Creates a transition from a source state to a target state.
     * Supports defining a new target state (chat or tool) or linking to an existing one.
     */
    transition(
        source: JourneyState,
        options: TransitionOptions,
    ): JourneyTransition {
        let targetState: JourneyState;

        const chatContent = options.chatState;
        const toolContent = options.toolState;
        const existingState = options.state;

        if (existingState) {
            targetState = existingState;
        } else if (chatContent) {
            targetState = this.createState("chat", chatContent);
        } else if (toolContent) {
            const toolName =
                typeof toolContent === "function"
                    ? toolContent.name
                    : typeof toolContent === "object" && toolContent?.name
                    ? toolContent.name
                    : String(toolContent);
            targetState = this.createState("tool", toolName);
        } else {
            throw new Error(
                "Invalid transition target: must provide state, chatState, or toolState",
            );
        }

        const transition: JourneyTransition = {
            source,
            target: targetState,
            condition: options.condition,
        };
        this.addTransition(transition);
        return transition;
    }
}
