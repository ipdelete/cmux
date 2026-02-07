// Dynamic import for ESM-only @github/copilot-sdk in CJS Electron main process
type CopilotClientType = import('@github/copilot-sdk').CopilotClient;
type CopilotSessionType = import('@github/copilot-sdk').CopilotSession;

async function loadSdk() {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function('return import("@github/copilot-sdk")')() as Promise<typeof import('@github/copilot-sdk')>;
}

export class CopilotService {
  private client: CopilotClientType | null = null;
  private session: CopilotSessionType | null = null;

  async start(): Promise<void> {
    const { CopilotClient } = await loadSdk();
    this.client = new CopilotClient();
    await this.client.start();
  }

  async sendMessage(
    prompt: string,
    messageId: string,
    onChunk: (messageId: string, content: string) => void,
    onDone: (messageId: string, fullContent?: string) => void,
    onError: (messageId: string, error: string) => void,
  ): Promise<void> {
    try {
      if (!this.client) {
        await this.start();
      }

      if (!this.session) {
        this.session = await this.client!.createSession();
      }

      let receivedChunks = false;

      // Stream deltas as they arrive
      const unsubDelta = this.session.on('assistant.message_delta', (event) => {
        receivedChunks = true;
        onChunk(messageId, event.data.deltaContent);
      });

      // sendAndWait blocks until the full response is ready
      const response = await this.session.sendAndWait({ prompt });

      unsubDelta();

      // If no streaming chunks were received, send the full response content
      if (!receivedChunks && response?.data.content) {
        onChunk(messageId, response.data.content);
      }

      onDone(messageId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError(messageId, message);
    }
  }

  async stop(): Promise<void> {
    if (this.session) {
      await this.session.destroy().catch(() => {});
      this.session = null;
    }
    if (this.client) {
      await this.client.stop().catch(() => {});
      this.client = null;
    }
  }
}
