declare module "ai-artifacts" {
    export function setArtifactStore(data: {
        artifacts: Record<string, any[]>;
    }): void;

    export const artifactStore: any;
}

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "ai-artifacts": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                "store-id"?: string;
                "group-id"?: string;
                "version-id"?: string;
            };
        }
    }
}
export {};
