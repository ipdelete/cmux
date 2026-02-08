// Orchestrator tools — custom SDK tools that the chat session can call
// to create and manage agents in Vibe Playground.

import * as fs from 'fs';
import * as path from 'path';
import { loadSdk } from './SdkLoader';
import { agentSessionService } from './AgentSessionService';

type ToolType = import('@github/copilot-sdk').Tool;

export interface AgentCreatedInfo {
  agentId: string;
  label: string;
  cwd: string;
}

// Callback set by IPC layer to notify renderer when an agent is created
let onAgentCreated: ((info: AgentCreatedInfo) => void) | null = null;

export function setOnAgentCreated(callback: (info: AgentCreatedInfo) => void): void {
  onAgentCreated = callback;
}

// Track agents created by the orchestrator
const managedAgents = new Map<string, { label: string; cwd: string }>();

export async function createOrchestratorTools(): Promise<ToolType[]> {
  const { defineTool } = await loadSdk();

  const createAgent = defineTool('create_agent', {
    description: 'Create a new coding agent scoped to a local repository folder. The agent gets its own Copilot session and appears in the left pane. Returns the agent ID for use with send_to_agent.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute path to a local repository folder (e.g., /home/user/src/my-project)',
        },
        label: {
          type: 'string',
          description: 'Display name for the agent. Defaults to the folder name.',
        },
      },
      required: ['path'],
    },
    handler: async (args: { path: string; label?: string }) => {
      const resolvedPath = resolvePath(args.path);

      if (!fs.existsSync(resolvedPath)) {
        return { error: `Path does not exist: ${resolvedPath}` };
      }

      const stat = fs.statSync(resolvedPath);
      if (!stat.isDirectory()) {
        return { error: `Path is not a directory: ${resolvedPath}` };
      }

      const agentId = `agent-${Date.now()}`;
      const label = args.label || path.basename(resolvedPath);

      // Create the SDK session for this agent
      await agentSessionService.createSession(agentId, resolvedPath);

      // Track it
      managedAgents.set(agentId, { label, cwd: resolvedPath });

      // Notify renderer to add agent to UI
      if (onAgentCreated) {
        onAgentCreated({ agentId, label, cwd: resolvedPath });
      }

      return {
        agentId,
        label,
        cwd: resolvedPath,
        message: `Agent "${label}" created and ready. Use send_to_agent to give it tasks.`,
      };
    },
  });

  const sendToAgent = defineTool('send_to_agent', {
    description: 'Send a task or prompt to an existing coding agent. The agent will execute the task in its scoped repository using Copilot.',
    parameters: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The agent ID returned from create_agent.',
        },
        prompt: {
          type: 'string',
          description: 'The task or instruction for the agent to execute.',
        },
      },
      required: ['agentId', 'prompt'],
    },
    handler: async (args: { agentId: string; prompt: string }) => {
      if (!agentSessionService.hasSession(args.agentId)) {
        return { error: `No active session for agent ${args.agentId}. Create one first with create_agent.` };
      }

      try {
        await agentSessionService.sendPrompt(args.agentId, args.prompt);
        const info = managedAgents.get(args.agentId);
        return {
          message: `Task sent to agent "${info?.label ?? args.agentId}" and completed.`,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: `Agent task failed: ${message}` };
      }
    },
  });

  const listAgents = defineTool('list_agents', {
    description: 'List all active coding agents and their status.',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const agents: Array<{ agentId: string; label: string; cwd: string; active: boolean }> = [];
      for (const [agentId, info] of managedAgents) {
        agents.push({
          agentId,
          label: info.label,
          cwd: info.cwd,
          active: agentSessionService.hasSession(agentId),
        });
      }
      return agents.length > 0
        ? { agents }
        : { message: 'No agents are currently active. Use create_agent to create one.' };
    },
  });

  return [createAgent, sendToAgent, listAgents];
}

function resolvePath(inputPath: string): string {
  // Expand ~ to home directory
  if (inputPath.startsWith('~/') || inputPath === '~') {
    const home = process.env.HOME || process.env.USERPROFILE || '/';
    return path.join(home, inputPath.slice(2));
  }
  return path.resolve(inputPath);
}

export const ORCHESTRATOR_SYSTEM_MESSAGE = `You are the Vibe Playground orchestrator. You help users manage coding agents that work on local repositories.

You have access to these tools:
- **create_agent**: Create a new coding agent scoped to a local repo folder. The agent appears in the UI and can execute tasks autonomously.
- **send_to_agent**: Send a task or prompt to an existing agent. The agent uses Copilot to execute the task in its repository.
- **list_agents**: List all active agents and their status.

When a user asks you to work on a project, create an agent for it first, then send it tasks. You can manage multiple agents simultaneously.

Example flow:
1. User: "Fix the auth bug in ~/src/pallet"
2. You: call create_agent({path: "~/src/pallet"})
3. You: call send_to_agent({agentId: "...", prompt: "Fix the authentication bug"})

Always confirm what you're about to do before creating agents. Be concise in your responses.`;
