import { registerAgent, unregisterAgent, getActiveAgents } from './OrchestratorTools';

describe('OrchestratorTools', () => {
  describe('unregisterAgent', () => {
    it('should remove an agent from managedAgents', () => {
      registerAgent('agent-1', 'Test Agent', '/tmp/repo');
      expect(getActiveAgents()).toContainEqual({
        agentId: 'agent-1',
        label: 'Test Agent',
        cwd: '/tmp/repo',
      });

      unregisterAgent('agent-1');
      expect(getActiveAgents().find(a => a.agentId === 'agent-1')).toBeUndefined();
    });

    it('should be a no-op for unknown agent ids', () => {
      const before = getActiveAgents().length;
      unregisterAgent('nonexistent');
      expect(getActiveAgents().length).toBe(before);
    });
  });
});
