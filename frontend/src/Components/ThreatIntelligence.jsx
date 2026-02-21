import React, { useState, useEffect } from 'react';
import { FiGlobe, FiDownload, FiUpload, FiRefreshCw, FiFilter, FiSearch, FiAlertTriangle, FiShield, FiDatabase } from 'react-icons/fi';
import { apiRequest } from '../api/client';
import { useToast } from './Toast';

const ThreatIntelligence = () => {
  const [intelligenceData, setIntelligenceData] = useState({
    externalFeeds: [],
    internalIOCs: [],
    threatTrends: [],
    sharingStatus: {}
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();

  const loadThreatIntelligence = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      setIntelligenceData({
        externalFeeds: [
          {
            id: 1,
            name: 'VirusTotal',
            type: 'malware',
            status: 'active',
            lastUpdate: new Date(Date.now() - 3600000),
            iocCount: 15420,
            reliability: 95,
            description: 'Comprehensive malware analysis and URL scanning'
          },
          {
            id: 2,
            name: 'AlienVault OTX',
            type: 'threat',
            status: 'active',
            lastUpdate: new Date(Date.now() - 1800000),
            iocCount: 8934,
            reliability: 88,
            description: 'Open threat intelligence platform'
          },
          {
            id: 3,
            name: 'MISP',
            type: 'ioc',
            status: 'active',
            lastUpdate: new Date(Date.now() - 900000),
            iocCount: 5671,
            reliability: 92,
            description: 'Threat intelligence sharing platform'
          }
        ],
        internalIOCs: [
          {
            id: 1,
            type: 'domain',
            value: 'malicious-phishing-site.com',
            confidence: 95,
            source: 'user_report',
            firstSeen: new Date(Date.now() - 86400000),
            lastSeen: new Date(),
            tags: ['phishing', 'banking', 'credential_theft'],
            status: 'active'
          },
          {
            id: 2,
            type: 'ip',
            value: '192.168.1.100',
            confidence: 87,
            source: 'scan_result',
            firstSeen: new Date(Date.now() - 172800000),
            lastSeen: new Date(Date.now() - 3600000),
            tags: ['malware', 'c2', 'trojan'],
            status: 'active'
          },
          {
            id: 3,
            type: 'hash',
            value: 'a1b2c3d4e5f6...',
            confidence: 98,
            source: 'file_analysis',
            firstSeen: new Date(Date.now() - 259200000),
            lastSeen: new Date(Date.now() - 7200000),
            tags: ['malware', 'backdoor', 'windows'],
            status: 'active'
          }
        ],
        threatTrends: [
          {
            threat_type: 'phishing',
            count: 342,
            change: '+12%',
            severity: 'high',
            top_targets: ['banking', 'email', 'social_media']
          },
          {
            threat_type: 'malware',
            count: 189,
            change: '+8%',
            severity: 'critical',
            top_targets: ['windows', 'android', 'ios']
          },
          {
            threat_type: 'social_engineering',
            count: 276,
            change: '+15%',
            severity: 'medium',
            top_targets: ['corporate', 'healthcare', 'education']
          }
        ],
        sharingStatus: {
          shared_today: 47,
          received_today: 123,
          partners_active: 8,
          last_sync: new Date(Date.now() - 300000)
        }
      });
    } catch (error) {
      console.error('Error loading threat intelligence:', error);
      showError('Failed to load threat intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const syncExternalFeeds = async () => {
    showInfo('Syncing external threat intelligence feeds...');
    
    // Simulate sync process
    setTimeout(() => {
      showSuccess('Successfully synced 3 external feeds with 1,247 new IOCs');
      loadThreatIntelligence();
    }, 3000);
  };

  const shareIntelligence = async () => {
    setIsSharing(true);
    try {
      // Simulate sharing process
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Threat intelligence shared with 8 partner organizations');
    } catch (error) {
      showError('Failed to share threat intelligence');
    } finally {
      setIsSharing(false);
    }
  };

  const exportIOCs = () => {
    const csvContent = 'type,value,confidence,source,tags\n' +
      intelligenceData.internalIOCs.map(ioc => 
        `${ioc.type},${ioc.value},${ioc.confidence},${ioc.source},"${ioc.tags.join(',')}"`
      ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat_intelligence_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('IOCs exported successfully');
  };

  const getReliabilityColor = (reliability) => {
    if (reliability >= 90) return 'text-green-400';
    if (reliability >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-orange-400 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-blue-400 bg-blue-500/10';
    }
  };

  const filteredIOCs = intelligenceData.internalIOCs.filter(ioc => {
    const matchesFilter = filter === 'all' || ioc.type === filter;
    const matchesSearch = ioc.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ioc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    loadThreatIntelligence();
  }, []);

  return (
    <div className="threat-intelligence">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <FiGlobe className="w-6 h-6" />
            <span>Threat Intelligence</span>
          </h2>
          <p className="text-gray-400">External feeds, IOC sharing, and threat analysis</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={syncExternalFeeds}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Sync Feeds</span>
          </button>
          <button
            onClick={shareIntelligence}
            disabled={isSharing}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <FiUpload className="w-4 h-4" />
            <span>{isSharing ? 'Sharing...' : 'Share Intelligence'}</span>
          </button>
          <button
            onClick={exportIOCs}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export IOCs</span>
          </button>
        </div>
      </div>

      {/* Sharing Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{intelligenceData.sharingStatus.shared_today}</div>
              <div className="text-sm text-gray-400">Shared Today</div>
            </div>
            <FiUpload className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{intelligenceData.sharingStatus.received_today}</div>
              <div className="text-sm text-gray-400">Received Today</div>
            </div>
            <FiDownload className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{intelligenceData.sharingStatus.partners_active}</div>
              <div className="text-sm text-gray-400">Active Partners</div>
            </div>
            <FiGlobe className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">
                {intelligenceData.sharingStatus.last_sync ? 
                  new Date(intelligenceData.sharingStatus.last_sync).toLocaleTimeString() : 
                  'Never'
                }
              </div>
              <div className="text-sm text-gray-400">Last Sync</div>
            </div>
            <FiRefreshCw className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* External Feeds */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FiDatabase className="w-5 h-5" />
            <span>External Feeds</span>
          </h3>
          
          <div className="space-y-3">
            {intelligenceData.externalFeeds.map(feed => (
              <div key={feed.id} className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium">{feed.name}</h4>
                    <p className="text-sm text-gray-400">{feed.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    feed.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {feed.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">IOCs:</span>
                    <span className="text-white ml-2">{feed.iocCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Reliability:</span>
                    <span className={`ml-2 ${getReliabilityColor(feed.reliability)}`}>{feed.reliability}%</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  Last update: {new Date(feed.lastUpdate).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Internal IOCs */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FiShield className="w-5 h-5" />
            <span>Internal IOCs</span>
          </h3>
          
          {/* Search and Filter */}
          <div className="flex space-x-2 mb-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search IOCs..."
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="domain">Domains</option>
              <option value="ip">IPs</option>
              <option value="hash">Hashes</option>
            </select>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredIOCs.map(ioc => (
              <div key={ioc.id} className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-white font-mono text-sm">{ioc.value}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-400">{ioc.type}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(ioc.confidence > 90 ? 'high' : 'medium')}`}>
                        {ioc.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    ioc.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {ioc.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {ioc.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500">
                  Source: {ioc.source} • First seen: {new Date(ioc.firstSeen).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Threat Trends */}
      <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <FiAlertTriangle className="w-5 h-5" />
          <span>Threat Trends</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {intelligenceData.threatTrends.map(trend => (
            <div key={trend.threat_type} className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium capitalize">{trend.threat_type.replace('_', ' ')}</h4>
                <span className={`text-sm px-2 py-1 rounded ${getSeverityColor(trend.severity)}`}>
                  {trend.severity}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-white">{trend.count}</span>
                <span className={`text-sm font-medium ${
                  trend.change.startsWith('+') ? 'text-red-400' : 'text-green-400'
                }`}>
                  {trend.change}
                </span>
              </div>
              
              <div className="text-sm text-gray-400">
                <div className="mb-1">Top Targets:</div>
                <div className="flex flex-wrap gap-1">
                  {trend.top_targets.map(target => (
                    <span key={target} className="text-xs bg-gray-600 px-2 py-1 rounded">
                      {target}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThreatIntelligence;
