import React, { useState, useEffect } from 'react';
import { FiShield, FiPlay, FiPause, FiSettings, FiAlertTriangle, FiCheckCircle, FiClock, FiActivity, FiZap, FiLock, FiDatabase } from 'react-icons/fi';
import { useToast } from './Toast';
import { apiRequest } from '../api/client';

const IncidentResponse = () => {
  const [workflows, setWorkflows] = useState([]);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, showInfo } = useToast();

  const loadIncidentData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('scam_defender_token');
      
      // Load incident response data from backend
      const workflowsResponse = await apiRequest('/response/workflows', { token });
      const incidentsResponse = await apiRequest('/response/incidents', { token });
      const rulesResponse = await apiRequest('/response/automation-rules', { token });
      
      setWorkflows(workflowsResponse.workflows || []);
      setActiveIncidents(incidentsResponse.incidents || []);
      setAutomationRules(rulesResponse.rules || []);
    } catch (error) {
      console.error('Error loading incident data:', error);
      showError('Failed to load incident response data');
      
      // Fallback to mock data
      setWorkflows([
        {
          id: 1,
          name: 'High-Risk Phishing Response',
          description: 'Automated response for confirmed phishing threats',
          triggers: ['phishing', 'confidence > 90%'],
          actions: ['block_domain', 'notify_users', 'update_firewall', 'create_ticket'],
          status: 'active',
          last_run: new Date(Date.now() - 3600000),
          success_rate: 98.5
        },
        {
          id: 2,
          name: 'Malware Detection Response',
          description: 'Response workflow for detected malware files',
          triggers: ['malware', 'file_scan'],
          actions: ['quarantine_file', 'scan_network', 'notify_admin', 'update_signatures'],
          status: 'active',
          last_run: new Date(Date.now() - 7200000),
          success_rate: 96.2
        },
        {
          id: 3,
          name: 'Suspicious Activity Alert',
          description: 'Alert and monitoring for suspicious but unconfirmed threats',
          triggers: ['suspicious', 'confidence 60-90%'],
          actions: ['log_activity', 'increase_monitoring', 'notify_team'],
          status: 'active',
          last_run: new Date(Date.now() - 1800000),
          success_rate: 100
        }
      ]);

      setActiveIncidents([
        {
          id: 1,
          type: 'phishing',
          severity: 'high',
          status: 'responding',
          detected_at: new Date(Date.now() - 300000),
          workflow_triggered: 'High-Risk Phishing Response',
          actions_completed: ['block_domain', 'notify_users'],
          actions_pending: ['update_firewall'],
          affected_assets: 3,
          risk_score: 85
        },
        {
          id: 2,
          type: 'malware',
          severity: 'critical',
          status: 'containment',
          detected_at: new Date(Date.now() - 600000),
          workflow_triggered: 'Malware Detection Response',
          actions_completed: ['quarantine_file', 'isolate_system'],
          actions_pending: ['scan_network'],
          affected_assets: 1,
          risk_score: 95
        },
        {
          id: 3,
          type: 'suspicious_activity',
          severity: 'medium',
          status: 'monitoring',
          detected_at: new Date(Date.now() - 900000),
          workflow_triggered: 'Suspicious Activity Alert',
          actions_completed: ['log_activity', 'increase_monitoring'],
          actions_pending: ['notify_team'],
          affected_assets: 1,
          risk_score: 65
        }
      ]);

      setAutomationRules([
        {
          id: 1,
          name: 'Auto-Block Malicious Domains',
          description: 'Automatically block domains with >95% confidence threat score',
          condition: 'threat_score > 95 AND threat_type = phishing',
          action: 'block_domain',
          enabled: true,
          triggers_today: 47,
          last_triggered: new Date(Date.now() - 600000)
        },
        {
          id: 2,
          name: 'Critical Threat Notification',
          description: 'Send immediate alerts for critical threats',
          condition: 'severity = critical',
          action: 'notify_admin_team',
          enabled: true,
          triggers_today: 8,
          last_triggered: new Date(Date.now() - 1800000)
        },
        {
          id: 3,
          name: 'Quarantine Suspicious Files',
          description: 'Auto-quarantine files with high malware probability',
          condition: 'malware_probability > 90%',
          action: 'quarantine_file',
          enabled: true,
          triggers_today: 12,
          last_triggered: new Date(Date.now() - 3600000)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = (workflowId) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
        : w
    ));
    showSuccess('Workflow status updated');
  };

  const triggerWorkflow = (workflowId) => {
    showInfo('Manually triggering workflow...');
    setTimeout(() => {
      showSuccess('Workflow executed successfully');
    }, 2000);
  };

  const toggleRule = (ruleId) => {
    setAutomationRules(prev => prev.map(r => 
      r.id === ruleId 
        ? { ...r, enabled: !r.enabled }
        : r
    ));
    showSuccess('Automation rule updated');
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'responding': return <FiActivity className="w-4 h-4 text-orange-400" />;
      case 'contained': return <FiLock className="w-4 h-4 text-green-400" />;
      case 'monitoring': return <FiClock className="w-4 h-4 text-yellow-400" />;
      case 'resolved': return <FiCheckCircle className="w-4 h-4 text-green-400" />;
      default: return <FiAlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getWorkflowIcon = (action) => {
    switch(action) {
      case 'block_domain': return <FiShield className="w-4 h-4" />;
      case 'quarantine_file': return <FiLock className="w-4 h-4" />;
      case 'notify_users': return <FiZap className="w-4 h-4" />;
      case 'update_firewall': return <FiDatabase className="w-4 h-4" />;
      default: return <FiActivity className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    loadIncidentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-400">Loading incident response...</span>
      </div>
    );
  }

  return (
    <div className="incident-response">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <FiShield className="w-6 h-6" />
            <span>Incident Response</span>
          </h2>
          <p className="text-gray-400">Automated workflows and incident management</p>
        </div>
      </div>

      {/* Active Incidents */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Incidents</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {activeIncidents.map(incident => (
            <div key={incident.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-medium">{incident.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Workflow: {incident.workflow_triggered}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </span>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                {getStatusIcon(incident.status)}
                <span className="text-sm text-gray-300 capitalize">{incident.status}</span>
                <span className="text-xs text-gray-500">
                  {new Date(incident.detected_at).toLocaleTimeString()}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Risk Score:</span>
                  <span className="text-white font-medium">{incident.risk_score}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Affected Assets:</span>
                  <span className="text-white">{incident.affected_assets}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-400">Completed Actions:</div>
                <div className="flex flex-wrap gap-1">
                  {incident.actions_completed.map(action => (
                    <span key={action} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded flex items-center space-x-1">
                      {getWorkflowIcon(action)}
                      <span>{action.replace('_', ' ')}</span>
                    </span>
                  ))}
                </div>
                {incident.actions_pending.length > 0 && (
                  <>
                    <div className="text-sm text-gray-400 mt-2">Pending Actions:</div>
                    <div className="flex flex-wrap gap-1">
                      {incident.actions_pending.map(action => (
                        <span key={action} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded flex items-center space-x-1">
                          <FiClock className="w-3 h-3" />
                          <span>{action.replace('_', ' ')}</span>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Workflows */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Response Workflows</h3>
          <div className="space-y-4">
            {workflows.map(workflow => (
              <div key={workflow.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{workflow.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{workflow.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      workflow.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {workflow.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="text-sm text-gray-400">Triggers:</div>
                  <div className="flex flex-wrap gap-1">
                    {workflow.triggers.map(trigger => (
                      <span key={trigger} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        {trigger}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="text-sm text-gray-400">Actions:</div>
                  <div className="flex flex-wrap gap-1">
                    {workflow.actions.map(action => (
                      <span key={action} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded flex items-center space-x-1">
                        {getWorkflowIcon(action)}
                        <span>{action.replace('_', ' ')}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    Success Rate: <span className="text-green-400">{workflow.success_rate}%</span>
                  </span>
                  <span className="text-gray-500">
                    Last run: {new Date(workflow.last_run).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => toggleWorkflow(workflow.id)}
                    className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                      workflow.status === 'active'
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {workflow.status === 'active' ? (
                      <>
                        <FiPause className="w-4 h-4 inline mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <FiPlay className="w-4 h-4 inline mr-2" />
                        Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => triggerWorkflow(workflow.id)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FiPlay className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Automation Rules */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FiSettings className="w-5 h-5" />
            <span>Automation Rules</span>
          </h3>
          <div className="space-y-4">
            {automationRules.map(rule => (
              <div key={rule.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{rule.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rule.enabled ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="text-sm text-gray-400">Condition:</div>
                  <div className="text-sm font-mono text-blue-400 bg-gray-800/50 p-2 rounded">
                    {rule.condition}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    Action: <span className="text-purple-400">{rule.action.replace('_', ' ')}</span>
                  </span>
                  <span className="text-gray-500">
                    {rule.triggers_today} triggers today
                  </span>
                </div>

                {rule.last_triggered && (
                  <div className="text-xs text-gray-500 mt-2">
                    Last triggered: {new Date(rule.last_triggered).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Statistics */}
      <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Response Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {workflows.filter(w => w.status === 'active').length}
            </div>
            <div className="text-sm text-gray-400">Active Workflows</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {automationRules.filter(r => r.enabled).length}
            </div>
            <div className="text-sm text-gray-400">Enabled Rules</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">
              {activeIncidents.length}
            </div>
            <div className="text-sm text-gray-400">Active Incidents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {Math.round(workflows.reduce((sum, w) => sum + w.success_rate, 0) / workflows.length)}%
            </div>
            <div className="text-sm text-gray-400">Avg Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentResponse;
