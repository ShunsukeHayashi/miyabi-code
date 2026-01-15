import { ProviderHelper, CommonRequest, CommonResponse, CommonChunk } from "./provider"

type GLMUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

export const glmHelper = {
  format: "glm" as const,
  modifyUrl: (providerApi: string) => providerApi + "/chat/completions",
  modifyHeaders: (headers: Headers, _body: Record<string, any>, apiKey: string) => {
    headers.set("Authorization", `Bearer ${apiKey}`)
    headers.set("Content-Type", "application/json")
  },
  modifyBody: (body: Record<string, any>) => body,
  streamSeparator: "\n\n",
  createUsageParser: () => {
    let usage: GLMUsage = {}

    return {
      parse: (chunk: string) => {
        if (!chunk.startsWith("data: ")) return

        try {
          const json = JSON.parse(chunk.slice(6))
          const usageUpdate = json.usage
          if (!usageUpdate) return
          usage = {
            ...usage,
            ...usageUpdate,
          }
        } catch (e) {
          return
        }
      },
      retrieve: () => usage,
    }
  },
  normalizeUsage: (usage: GLMUsage) => ({
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
    reasoningTokens: undefined,
    cacheReadTokens: undefined,
    cacheWrite5mTokens: undefined,
    cacheWrite1hTokens: undefined,
  }),
} satisfies ProviderHelper

export function fromGLMRequest(body: any): CommonRequest {
  if (!body || typeof body !== "object") return body

  return {
    model: body.model || "glm-4.7",
    max_tokens: body.max_tokens,
    temperature: body.temperature,
    top_p: body.top_p,
    stop: body.stop,
    messages: body.messages || [],
    stream: body.stream ?? false,
    tools: body.tools,
    tool_choice: body.tool_choice,
  }
}

export function toGLMRequest(body: any): any {
  if (!body || typeof body !== "object") return body

  return {
    model: body.model,
    messages: body.messages,
    temperature: body.temperature,
    top_p: body.top_p,
    max_tokens: body.max_tokens,
    stop: body.stop,
    stream: body.stream,
    tools: body.tools,
    tool_choice: body.tool_choice,
  }
}

export function fromGLMChunk(chunk: any): CommonChunk {
  if (!chunk || typeof chunk !== "object") return chunk

  const choices = chunk.choices || []
  const firstChoice = choices[0] || {}
  const delta = firstChoice.delta || {}

  return {
    id: chunk.id,
    object: "chat.completion.chunk" as const,
    created: chunk.created || Date.now(),
    model: chunk.model || "glm-4.7",
    choices: [{
      index: chunk.index || 0,
      delta: {
        role: delta.role,
        content: delta.content,
        tool_calls: delta.tool_calls,
      },
      finish_reason: null,
    }],
    usage: {
      prompt_tokens: chunk.usage?.prompt_tokens,
      completion_tokens: chunk.usage?.completion_tokens,
      total_tokens: chunk.usage?.total_tokens,
    },
  }
}

export function toGLMResponse(response: any): CommonResponse {
  if (!response || typeof response !== "object") return response

  const choices = response.choices || []
  const firstChoice = choices[0] || {}
  const message = firstChoice.message || {}

  return {
    id: response.id || "",
    object: "chat.completion" as const,
    created: response.created || Date.now(),
    model: response.model || "glm-4.7",
    choices: [{
      index: 0,
      message: {
        role: message.role || "assistant",
        content: message.content,
        tool_calls: message.tool_calls,
      },
      finish_reason: message.finish_reason || "stop",
    }],
    usage: {
      prompt_tokens: response.usage?.prompt_tokens,
      completion_tokens: response.usage?.completion_tokens,
      total_tokens: response.usage?.total_tokens,
    },
  }
}

export {
  fromGLMChunk as fromGlmChunk,
  fromGLMRequest as fromGlmRequest,
  fromGLMResponse as fromGlmResponse,
  toGLMChunk as toGlmChunk,
  toGLMRequest as toGlmRequest,
  toGLMResponse as toGlmResponse,
}
