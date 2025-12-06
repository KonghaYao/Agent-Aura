import { createUITool } from "@langgraph-js/sdk";
import { z } from "zod";
import { CheckCircle2, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const webSearchResult = z.object({
    topic: z.string(),
    useful_webpages: z.array(z.string()),
});

const EndOfResearchSchema = z.object({
    search_result_of_current_topic: webSearchResult
});

export const end_of_search = createUITool({
    name: "end_of_research", // Matches the backend tool name
    description: "End of research summary",
    parameters: EndOfResearchSchema,
    onlyRender: true,
    render(tool) {
        const data = tool.getInputRepaired();
        // Safely access the nested data structure
        const result = data.search_result_of_current_topic || { topic: "Unknown", useful_webpages: [] };

        return (
             <Card className="w-full my-2 border-green-200 bg-green-50/30">
                <CardHeader className="pb-3 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <CardTitle className="text-base font-medium text-green-900">
                                Research Completed
                            </CardTitle>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            Done
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-medium text-green-600 mb-1 uppercase tracking-wider opacity-80">
                                Final Topic
                            </div>
                            <div className="text-sm font-medium text-gray-900 bg-white p-3 rounded-md border border-green-100 shadow-sm">
                                {result.topic}
                            </div>
                        </div>
                        
                        {result.useful_webpages && result.useful_webpages.length > 0 && (
                            <div>
                                <div className="text-xs font-medium text-green-600 mb-2 uppercase tracking-wider flex items-center gap-1 opacity-80">
                                    <LinkIcon className="w-3 h-3" />
                                    Collected Sources
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                    {result.useful_webpages.map((url, idx) => (
                                        <a 
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 text-xs text-gray-600 bg-white/60 hover:bg-white rounded border border-transparent hover:border-green-200 transition-all group"
                                        >
                                            <span className="w-5 h-5 flex items-center justify-center bg-green-100/50 group-hover:bg-green-100 rounded text-[10px] text-green-700 flex-shrink-0 font-medium transition-colors">
                                                {idx + 1}
                                            </span>
                                            <span className="truncate text-gray-600 group-hover:text-green-700 transition-colors">
                                                {url}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }
});

