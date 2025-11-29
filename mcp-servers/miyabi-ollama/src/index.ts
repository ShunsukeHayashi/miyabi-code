#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

async function ollamaGenerate(model: string, prompt: string, system?: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, system, stream: false }),
  });
  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
  const data = await response.json() as { response: string };
  return data.response;
}

async function ollamaListModels(): Promise<{name: string, size: number}[]> {
  const response = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
  const data = await response.json() as { models: {name: string, size: number}[] };
  return data.models;
}

const server = new Server({ name: "miyabi-ollama", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "ollama_generate", description: "Generate text using local Ollama LLM", inputSchema: { type: "object" as const, properties: { model: { type: "string" }, prompt: { type: "string" }, system: { type: "string" } }, required: ["prompt"] } },
    { name: "ollama_list_models", description: "List available Ollama models", inputSchema: { type: "object" as const, properties: {} } },
    { name: "ollama_code", description: "Generate code using local Ollama", inputSchema: { type: "object" as const, properties: { language: { type: "string" }, task: { type: "string" } }, required: ["language", "task"] } },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "ollama_generate") {
      const result = await ollamaGenerate((args?.model as string) || "qwen2.5-coder:1.5b", args?.prompt as string, args?.system as string);
      return { content: [{ type: "text", text: result }] };
    }
    if (name === "ollama_list_models") {
      const models = await ollamaListModels();
      return { content: [{ type: "text", text: models.map(m => `- ${m.name} (${(m.size/1024/1024).toFixed(0)}MB)`).join("\n") }] };
    }
    if (name === "ollama_code") {
      const result = await ollamaGenerate("qwen2.5-coder:1.5b", `Write ${args?.language} code: ${args?.task}. Only code.`, `Expert ${args?.language} programmer.`);
      return { content: [{ type: "text", text: result }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (e) { return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true }; }
});

const transport = new StdioServerTransport();
server.connect(transport);
