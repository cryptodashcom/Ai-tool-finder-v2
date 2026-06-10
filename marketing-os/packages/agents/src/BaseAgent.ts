import Anthropic from '@anthropic-ai/sdk';

export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export abstract class BaseAgent {
  protected client: Anthropic;
  protected model: string;

  constructor(model?: string) {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = model ?? DEFAULT_MODEL;
  }

  protected async callWithTool<T>(
    systemPrompt: string,
    userMessage: string,
    toolName: string,
    toolDescription: string,
    inputSchema: Anthropic.Tool['input_schema'],
    maxTokens = 4096,
  ): Promise<T> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      tools: [
        {
          name: toolName,
          description: toolDescription,
          input_schema: inputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: toolName },
      messages: [{ role: 'user', content: userMessage }],
    });

    for (const block of response.content) {
      if (block.type === 'tool_use' && block.name === toolName) {
        return block.input as T;
      }
    }
    throw new Error(`Agent ${toolName} did not return expected tool call`);
  }
}
