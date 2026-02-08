import * as React from 'react';
import { useRef, useEffect, useMemo } from 'react';
import { useAppState } from '../../contexts/AppStateContext';
import { Icon } from '../Icon';
import {
  AgentEvent,
  AgentEventToolStart,
  AgentEventToolComplete,
  AgentEventAssistantMessage,
  AgentEventError,
  AgentEventSubagentStarted,
  AgentEventSubagentCompleted,
  AgentEventSubagentFailed,
} from '../../../shared/types';

interface AgentActivityViewProps {
  agentId: string;
}

// Merged representation of a tool call (start + optional complete)
interface MergedToolCall {
  kind: 'merged-tool';
  toolCallId: string;
  toolName: string;
  arguments?: string;
  completed: boolean;
  success?: boolean;
  result?: string;
  error?: string;
  timestamp: number;
}

type DisplayEvent = MergedToolCall | AgentEvent;

function buildDisplayEvents(events: AgentEvent[]): DisplayEvent[] {
  const toolCalls = new Map<string, MergedToolCall>();
  const display: DisplayEvent[] = [];

  // Accumulate assistant deltas into a single message
  let accumulatedDelta = '';

  for (const event of events) {
    switch (event.kind) {
      case 'tool-start': {
        const merged: MergedToolCall = {
          kind: 'merged-tool',
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          arguments: event.arguments,
          completed: false,
          timestamp: event.timestamp,
        };
        toolCalls.set(event.toolCallId, merged);
        display.push(merged);
        break;
      }
      case 'tool-complete': {
        const existing = toolCalls.get(event.toolCallId);
        if (existing) {
          existing.completed = true;
          existing.success = event.success;
          existing.result = event.result;
          existing.error = event.error;
          if (existing.toolName === 'unknown' && event.toolName !== 'unknown') {
            existing.toolName = event.toolName;
          }
        } else {
          // No matching start — show standalone
          display.push({
            kind: 'merged-tool',
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            completed: true,
            success: event.success,
            result: event.result,
            error: event.error,
            timestamp: event.timestamp,
          });
        }
        break;
      }
      case 'assistant-delta': {
        accumulatedDelta += event.deltaContent;
        break;
      }
      case 'tool-progress':
      case 'tool-partial-result':
        // Skip transient events
        break;
      default:
        // Flush accumulated delta before non-delta events
        if (accumulatedDelta) {
          display.push({
            kind: 'assistant-message',
            messageId: 'accumulated',
            content: accumulatedDelta,
            timestamp: event.timestamp,
          } as AgentEventAssistantMessage);
          accumulatedDelta = '';
        }
        display.push(event);
        break;
    }
  }

  // Flush any remaining delta
  if (accumulatedDelta) {
    display.push({
      kind: 'assistant-message',
      messageId: 'accumulated',
      content: accumulatedDelta,
      timestamp: Date.now(),
    } as AgentEventAssistantMessage);
  }

  return display;
}

export function AgentActivityView({ agentId }: AgentActivityViewProps) {
  const { state } = useAppState();
  const feedEndRef = useRef<HTMLDivElement>(null);
  const events = state.agentEvents[agentId] ?? [];
  const displayEvents = useMemo(() => buildDisplayEvents(events), [events]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [displayEvents.length]);

  if (displayEvents.length === 0) {
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
        {displayEvents.map((event, i) => (
          <DisplayEventCard key={i} event={event} />
        ))}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}

function DisplayEventCard({ event }: { event: DisplayEvent }) {
  if (event.kind === 'merged-tool') {
    return <MergedToolCard event={event} />;
  }
  switch (event.kind) {
    case 'assistant-message':
      return <AssistantMessageCard event={event} />;
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
    default:
      return null;
  }
}

function MergedToolCard({ event }: { event: MergedToolCall }) {
  const [expanded, setExpanded] = React.useState(false);
  const toolLabel = formatToolName(event.toolName);
  const argsSummary = event.arguments ? summarizeArgs(event.toolName, event.arguments) : null;
  const hasContent = !!(event.result || event.error);

  const statusClass = event.completed
    ? event.success ? 'success' : 'failure'
    : '';

  return (
    <div className={`activity-card activity-card-tool-complete ${statusClass}`}>
      <div
        className="activity-card-header"
        onClick={() => hasContent && setExpanded(!expanded)}
        style={{ cursor: hasContent ? 'pointer' : 'default' }}
      >
        {event.completed
          ? <Icon name={event.success ? 'check' : 'error'} size="sm" />
          : <Icon name="play" size="sm" />
        }
        <span className="activity-card-title">{toolLabel}</span>
        {!event.completed && <span className="activity-card-spinner" />}
        {hasContent && (
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size="sm" />
        )}
      </div>
      {argsSummary && (
        <div className="activity-card-body">
          <code className="activity-code">{argsSummary}</code>
        </div>
      )}
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
    case 'report_intent': return 'Planning';
    case 'list_directory': return 'Listing directory';
    case 'read_file': return 'Reading file';
    default: return toolName.replace(/_/g, ' ');
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
      case 'report_intent': return parsed.intent ?? args;
      default: return args.length > 120 ? args.substring(0, 120) + '…' : args;
    }
  } catch {
    return args.length > 120 ? args.substring(0, 120) + '…' : args;
  }
}
