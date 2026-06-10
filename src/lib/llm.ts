import Anthropic from "@anthropic-ai/sdk";

export type Engine = "claude" | "ollama" | "lmstudio";

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  system?: string;
  model?: string;
  maxTokens?: number;
  stream?: boolean;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function* streamLLM(
  engine: Engine,
  messages: LLMMessage[],
  opts: LLMOptions = {},
): AsyncGenerator<string> {
  const { system, maxTokens = 4096 } = opts;

  if (engine === "claude") {
    const stream = await anthropic.messages.stream({
      model: opts.model ?? "claude-sonnet-4-5",
      max_tokens: maxTokens,
      system: system ?? "",
      messages,
    });
    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        yield chunk.delta.text;
      }
    }
    return;
  }

  if (engine === "ollama" || engine === "lmstudio") {
    const baseUrl =
      engine === "ollama"
        ? (process.env.OLLAMA_URL ?? "http://localhost:11434")
        : (process.env.LMSTUDIO_URL ?? "http://localhost:1234");

    const apiMessages = system
      ? [{ role: "system", content: system }, ...messages]
      : messages;

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: opts.model ?? "llama3",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!res.ok || !res.body)
      throw new Error(`${engine} API error: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
        try {
          const json = JSON.parse(line.slice(6));
          const text = json.choices?.[0]?.delta?.content ?? "";
          if (text) yield text;
        } catch {}
      }
    }
  }
}

export async function completeLLM(
  engine: Engine,
  messages: LLMMessage[],
  opts: LLMOptions = {},
): Promise<string> {
  let result = "";
  for await (const chunk of streamLLM(engine, messages, opts)) {
    result += chunk;
  }
  return result;
}
