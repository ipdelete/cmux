import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useAppState } from '../../contexts/AppStateContext';
import { Icon } from '../Icon';
import {
  AgentEvent,
  AgentEventToolStart,
  AgentEventToolComplete,
  AgentEventAssistantMessage,
  AgentEventAssistantDelta,
  AgentEventError,
  AgentEventSubagentStarted,
  AgentEventSubagentCompleted,
  AgentEventSubagentFailed,
} from '../../../shared/types';

interface AgentActivityViewProps {
  agentId: string;
}

export function AgentActivityView({ agentId }: AgentActivityViewProps) {
  const { state } = useAppState();
  const feedEndRef = useRef<HTMLDivElement>(null);
  const events = state.agentEvents[agentId] ?? [];

  useEffect(() => {
    feedEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [events.length]);

  if (events.length === 0) {
    const agent = state.agents.find(a => a.id === agentId);
    return (
      <div className="activity-feed">
        <div className="activity-empty">
          <Icon name="copilot" size={48} />
          <p>Agent session active for <strong>{agent?.label ?? 'unknown'}</strong></p>
          <p className="activity-empty-hint">Send a task from chat to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-events">
        {events.map((event, i) => (
          <EventCard key={i} event={event} />
        ))}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}

function EventCard({ event }: { event: AgentEvent }) {
  switch (event.kind) {
    case 'tool-start':
      return <ToolStartCard event={event} />;
    case 'tool-complete':
      return <ToolCompleteCard event={event} />;
    case 'assistant-message':
      return <AssistantMessageCard event={event} />;
    case 'assistant-delta':
      return <AssistantDeltaCard event={event} />;
    case 'error':
      return <ErrorCard event={event} />;
    case 'subagent-started':
      return <SubagentStartedCard event={event} />;
    case 'subagent-completed':
      return <SubagentCompletedCard event={event} />;
    case 'subagent-failed':
      return <SubagentFailedCard event={event} />;
    case 'session-idle':
      return <IdleCard />;
    case 'tool-progress':
    case 'tool-partial-result':
      // These are transient — skip rendering standalone cards
      return null;
    default:
      return null;
  }
}

function ToolStartCard({ event }: { event: AgentEventToolStart }) {
  const toolLabel = formatToolName(event.toolName);
  const argsSummary = event.arguments ? summarizeArgs(event.toolName, event.arguments) : null;

  return (
    <div className="activity-card activity-card-tool-start">
      <div className="activity-card-header">
        <Icon name="play" size="sm" />
        <span className="activity-card-title">{toolLabel}</span>
        <span className="activity-card-spinner" />
      </div>
      {argsSummary && (
        <div className="activity-card-body">
          <code className="activity-code">{argsSummary}</code>
        </div>
      )}
    </div>
  );
}

function ToolCompleteCard({ event }: { event: AgentEventToolComplete }) {
  const [expanded, setExpanded] = useState(false);
  const toolLabel = formatToolName(event.toolName);
  const hasContent = !!(event.result || event.error);

  return (
    <div className={`activity-card activity-card-tool-complete ${event.success ? 'success' : 'failure'}`}>
      <div
        className="activity-card-header"
        onClick={() => hasContent && setExpanded(!expanded)}
        style={{ cursor: hasContent ? 'pointer' : 'default' }}
      >
        <Icon name={event.success ? 'check' : 'error'} size="sm" />
        <span className="activity-card-title">{toolLabel}</span>
        {hasContent && (
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size="sm" />
        )}
      </div>
      {expanded && hasContent && (
        <div className="activity-card-body">
          <pre className="activity-pre">{event.error || event.result}</pre>
        </div>
      )}
    </div>
  );
}

function AssistantMessageCard({ event }: { event: AgentEventAssistantMessage }) {
  if (!event.content) return null;
  return (
    <div className="activity-card activity-card-assistant">
      <div className="activity-card-header">
        <Icon name="copilot" size="sm" />
        <span className="activity-card-title">Assistant</span>
      </div>
      <div className="activity-card-body">
        <div className="activity-text">{event.content}</div>
      </div>
    </div>
  );
}

function AssistantDeltaCard({ event }: { event: AgentEventAssistantDelta }): React.ReactElement | null {
  // Deltas are typically accumulated — show as-is for now
  if (!event.deltaContent) return null;
  return null; // Deltas will be accumulated into assistant-message; skip standalone render
}

function ErrorCard({ event }: { event: AgentEventError }) {
  return (
    <div className="activity-card activity-card-error">
      <div className="activity-card-header">
        <Icon name="error" size="sm" />
        <span className="activity-card-title">{event.errorType}</span>
      </div>
      <div className="activity-card-body">
        <div className="activity-text">{event.message}</div>
      </div>
    </div>
  );
}

function SubagentStartedCard({ event }: { event: AgentEventSubagentStarted }) {
  return (
    <div className="activity-card activity-card-subagent">
      <div className="activity-card-header">
        <Icon name="person" size="sm" />
        <span className="activity-card-title">Sub-agent: {event.agentDisplayName}</span>
        <span className="activity-card-spinner" />
      </div>
    </div>
  );
}

function SubagentCompletedCard({ event }: { event: AgentEventSubagentCompleted }) {
  return (
    <div className="activity-card activity-card-subagent success">
      <div className="activity-card-header">
        <Icon name="check" size="sm" />
        <span className="activity-card-title">Sub-agent: {event.agentName} completed</span>
      </div>
    </div>
  );
}

function SubagentFailedCard({ event }: { event: AgentEventSubagentFailed }) {
  return (
    <div className="activity-card activity-card-error">
      <div className="activity-card-header">
        <Icon name="error" size="sm" />
        <span className="activity-card-title">Sub-agent: {event.agentName} failed</span>
      </div>
      <div className="activity-card-body">
        <div className="activity-text">{event.error}</div>
      </div>
    </div>
  );
}

function IdleCard() {
  return (
    <div className="activity-card activity-card-idle">
      <div className="activity-card-header">
        <Icon name="check" size="sm" />
        <span className="activity-card-title">Done</span>
      </div>
    </div>
  );
}

// --- Helpers ---

function formatToolName(toolName: string): string {
  switch (toolName) {
    case 'bash': return 'Running command';
    case 'edit': return 'Editing file';
    case 'create': return 'Creating file';
    case 'view': return 'Reading file';
    case 'glob': return 'Finding files';
    case 'grep': return 'Searching code';
    case 'web_fetch': return 'Fetching URL';
    default: return toolName;
  }
}

function summarizeArgs(toolName: string, args: string): string {
  try {
    const parsed = JSON.parse(args);
    switch (toolName) {
      case 'bash': return parsed.command ?? args;
      case 'edit': return parsed.path ?? args;
      case 'create': return parsed.path ?? args;
      case 'view': return parsed.path ?? args;
      case 'glob': return parsed.pattern ?? args;
      case 'grep': return parsed.pattern ?? args;
      default: return args.length > 120 ? args.substring(0, 120) + '…' : args;
    }
  } catch {
    return args.length > 120 ? args.substring(0, 120) + '…' : args;
  }
}
