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

  const createAgent = defineTool('vp_create_agent', {
    description: 'Create a new coding agent scoped to a local repository folder. The agent gets its own Copilot session and appears in the left pane. Returns the agent ID for use with vp_send_to_agent.',
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
        message: `Agent "${label}" created and ready. Use vp_send_to_agent to give it tasks.`,
      };
    },
  });

  const sendToAgent = defineTool('vp_send_to_agent', {
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
        return { error: `No active session for agent ${args.agentId}. Create one first with vp_create_agent.` };
      }

      try {
        const result = await agentSessionService.sendPrompt(args.agentId, args.prompt);
        const info = managedAgents.get(args.agentId);
        return {
          agentLabel: info?.label ?? args.agentId,
          agentResponse: result ?? 'Agent completed but produced no text response.',
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: `Agent task failed: ${message}` };
      }
    },
  });

  const listAgents = defineTool('vp_list_agents', {
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
        : { message: 'No agents are currently active. Use vp_create_agent to create one.' };
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

export const ORCHESTRATOR_SYSTEM_MESSAGE = `You are also the Vibe Playground orchestrator. In addition to normal chat, you can manage coding agents that work on local repositories.

Available tools:
- **vp_create_agent**: Create a coding agent scoped to a local repo folder. Returns an agent ID.
- **vp_send_to_agent**: Send a task to an existing agent by ID. The agent executes it autonomously.
- **vp_list_agents**: List all active agents and their status.

Only use these tools when the user asks you to work on a project or manage agents. For general questions, respond normally.

When creating agents: validate the path, create the agent, then send it the task. Be concise.`;
