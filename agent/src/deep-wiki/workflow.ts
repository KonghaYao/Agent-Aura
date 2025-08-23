import { createDefaultAnnotation, createState } from "@langgraph-js/pro";
import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";
import { Annotation } from "@langchain/langgraph";

export const stateSchema = createState(createReactAgentAnnotation()).build({
    /** 用于 git 下载的 HTTP 地址
     * @example  https://github.com/konghayao/open-smith.git
     */
    repoUrl: Annotation<string>,
    /** 指定的节点 SHA 值 */
    nodeSHA: Annotation<string>,
    /** 是否完成分析 */
    isAnalyze: Annotation<boolean>,
    language: createDefaultAnnotation(() => "中文"),
});

export interface DownloadRepoState {
    repoUrl: string;
    nodeSHA: string;
    isAnalyze: boolean;
}
