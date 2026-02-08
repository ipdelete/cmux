// Manages SDK sessions scoped to agent working directories.
// Each agent gets its own CopilotSession with workingDirectory set,
// and all session events are routed to the renderer via callbacks.

import { getSharedClient } from './SdkLoader';
import { fileService } from './FileService';
import { AgentEvent } from '../../shared/types';

type CopilotSessionType = import('@github/copilot-sdk').CopilotSession;
type SessionEventType = import('@github/copilot-sdk').SessionEvent;
type PermissionRequestType = import('@github/copilot-sdk').PermissionRequest;
type PermissionRequestResultType = import('@github/copilot-sdk').PermissionRequestResult;

export type AgentEventCallback = (agentId: string, event: AgentEvent) => void;
export type PermissionRequestCallback = (
  agentId: string,
  request: PermissionRequestType,
) => Promise<PermissionRequestResultType>;

interface AgentSessionEntry {
  session: CopilotSessionType;
  unsubscribe: () => void;
}

class AgentSessionService {
  private sessions: Map<string, AgentSessionEntry> = new Map();
  private eventCallback: AgentEventCallback | null = null;
  private permissionCallback: PermissionRequestCallback | null = null;

  /** Register the callback that routes events to the renderer via IPC. */
  onEvent(callback: AgentEventCallback): void {
    this.eventCallback = callback;
  }

  /** Register the callback for permission requests that need user approval. */
  onPermissionRequest(callback: PermissionRequestCallback): void {
    this.permissionCallback = callback;
  }

  async createSession(agentId: string, cwd: string, model?: string): Promise<void> {
    // Tear down existing session for this agent if any
    await this.destroySession(agentId);

    // Allow file access to the agent's working directory
    fileService.addAllowedRoot(cwd);

    const client = await getSharedClient();
    const session = await client.createSession({
      model,
      workingDirectory: cwd,
      streaming: true,
      onPermissionRequest: async (request) => {
        if (this.permissionCallback) {
          return this.permissionCallback(agentId, request);
        }
        // Auto-approve if no handler registered
        return { kind: 'approved' };
      },
    });

    // Subscribe to all session events and map to AgentEvent
    const unsubscribe = session.on((event: SessionEventType) => {
      const mapped = this.mapEvent(event);
      if (mapped && this.eventCallback) {
        this.eventCallback(agentId, mapped);
      }
    });

    this.sessions.set(agentId, { session, unsubscribe });
  }

  async sendPrompt(agentId: string, prompt: string): Promise<string | undefined> {
    const entry = this.sessions.get(agentId);
    if (!entry) throw new Error(`No session for agent ${agentId}`);
    // Use sendAndWait so the orchestrator gets the actual result.
    // 5 minute timeout — agent tasks can take a while.
    const response = await entry.session.sendAndWait({ prompt }, 300_000);
    return response?.data?.content;
  }

  async stopAgent(agentId: string): Promise<void> {
    const entry = this.sessions.get(agentId);
    if (entry) {
      await entry.session.abort().catch(() => {});
    }
  }

  async destroySession(agentId: string): Promise<void> {
    const entry = this.sessions.get(agentId);
    if (entry) {
      entry.unsubscribe();
      await entry.session.destroy().catch(() => {});
      this.sessions.delete(agentId);
    }
  }

  async destroyAll(): Promise<void> {
    for (const agentId of this.sessions.keys()) {
      await this.destroySession(agentId);
    }
  }

  hasSession(agentId: string): boolean {
    return this.sessions.has(agentId);
  }

  private mapEvent(event: SessionEventType): AgentEvent | null {
    const ts = Date.now();

    switch (event.type) {
      case 'tool.execution_start':
        return {
          kind: 'tool-start',
          toolCallId: event.data.toolCallId,
          toolName: event.data.toolName,
          arguments: typeof event.data.arguments === 'string'
            ? event.data.arguments
            : event.data.arguments ? JSON.stringify(event.data.arguments) : undefined,
          timestamp: ts,
        };

      case 'tool.execution_complete':
        return {
          kind: 'tool-complete',
          toolCallId: event.data.toolCallId,
          toolName: (event.data as { toolName?: string }).toolName ?? 'unknown',
          success: event.data.success,
          result: event.data.result?.content,
          error: event.data.error?.message,
          timestamp: ts,
        };

      case 'tool.execution_progress':
        return {
          kind: 'tool-progress',
          toolCallId: event.data.toolCallId,
          progressMessage: event.data.progressMessage,
          timestamp: ts,
        };

      case 'tool.execution_partial_result':
        return {
          kind: 'tool-partial-result',
          toolCallId: event.data.toolCallId,
          partialOutput: event.data.partialOutput,
          timestamp: ts,
        };

      case 'assistant.message':
        return {
          kind: 'assistant-message',
          messageId: event.data.messageId,
          content: event.data.content ?? '',
          timestamp: ts,
        };

      case 'assistant.message_delta':
        return {
          kind: 'assistant-delta',
          messageId: event.data.messageId,
          deltaContent: event.data.deltaContent,
          timestamp: ts,
        };

      case 'session.error':
        return {
          kind: 'error',
          errorType: event.data.errorType,
          message: event.data.message,
          timestamp: ts,
        };

      case 'session.idle':
        return {
          kind: 'session-idle',
          timestamp: ts,
        };

      case 'subagent.started':
        return {
          kind: 'subagent-started',
          toolCallId: event.data.toolCallId,
          agentName: event.data.agentName,
          agentDisplayName: event.data.agentDisplayName,
          timestamp: ts,
        };

      case 'subagent.completed':
        return {
          kind: 'subagent-completed',
          toolCallId: event.data.toolCallId,
          agentName: event.data.agentName,
          timestamp: ts,
        };

      case 'subagent.failed':
        return {
          kind: 'subagent-failed',
          toolCallId: event.data.toolCallId,
          agentName: event.data.agentName,
          error: event.data.error,
          timestamp: ts,
        };

      default:
        // Ignore events we don't need to surface (session.start, session.truncation, etc.)
        return null;
    }
  }
}

export const agentSessionService = new AgentSessionService();
