import { createMemo, createSignal, createResource } from "solid-js";
import html from "solid-js/html";

export const GraphStatePanel = (props) => {
    const state = createMemo(() => {
        const data = { ...props.state };
        delete data.messages;
        return data;
    });
    return html`<json-viewer data=${state()}></json-viewer>`;
};

import { load } from "https://esm.run/@langchain/core/dist/load/index.js";
export const GraphStateMessage = (props) => {
    const [message] = createResource(async () => {
        try {
            if (!props.state?.messages?.length) {
                return [];
            }
            const messages = props.state.messages.flat();
            const LangChainMessages = await Promise.all(
                messages.map((i) => load(JSON.stringify(i))),
            );
            console.log(LangChainMessages);
            return LangChainMessages;
        } catch (error) {
            console.error(error);
            return [];
        }
    });
    return html`<div>
        ${() =>
            message.loading
                ? "loading..."
                : message().map((i) => {
                      if (!i._getType) {
                          console.warn("Unknown message type", i);
                          return html`<div>${JSON.stringify(i)}</div>`;
                      }
                      if (i["_getType"]() === "ai") {
                          return html`<div>
                              AI:
                              ${i.content &&
                              ContentViewer({ content: i.content })}
                              ${i.tool_calls &&
                              i.tool_calls.map((toolCall) => {
                                  return html`<div>
                                      Tool Call: ${toolCall.name}
                                      <json-viewer
                                          data=${toolCall.args}
                                      ></json-viewer>
                                  </div>`;
                              })}
                          </div>`;
                      } else if (
                          i["_getType"]() === "human" ||
                          i["_getType"]() === "system"
                      ) {
                          return html`<div>
                              Human: ${ContentViewer({ content: i.content })}
                          </div>`;
                      } else if (i["_getType"]() === "tool") {
                          return html`<div>
                              Tool:${ContentViewer({ content: i.content })}
                          </div>`;
                      } else {
                          return html`<div>${JSON.stringify(i)}</div>`;
                      }
                  })}
    </div>`;
};

const ContentViewer = (props) => {
    // console.log(props.content);
    if (typeof props.content === "string") {
        return html`<div>${props.content}</div>`;
    } else if (Array.isArray(props.content)) {
        return html`<div>
            ${props.content.map((i) => ContentViewer({ content: i }))}
        </div>`;
    } else if (typeof props.content === "object") {
        if (props.content.type === "text") {
            return html`<div>${props.content.text}</div>`;
        } else if (props.content.type === "image_url") {
            return html`<div>${props.content.image_url.url}</div>`;
        } else {
            return html`<div>${JSON.stringify(props.content)}</div>`;
        }
    } else {
        return html`<div>${props.content}</div>`;
    }
};
