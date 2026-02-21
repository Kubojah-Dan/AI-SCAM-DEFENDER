import React, { useState, useEffect } from 'react';
import { FiEye, FiClock, FiAlertTriangle, FiCheckCircle, FiXCircle, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { apiRequest } from '../api/client';

const CommunityThreatFeed = () => {
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState({
    reportedToday: 0,
    confirmedThreats: 0,
    underReview: 0
  });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const filterOptions = [
    { value: 'all', label: 'All Reports' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'confirmed', label: 'Confirmed Threats' },
    { value: 'false_positive', label: 'False Positives' }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs flex items-center space-x-1">
            <FiClock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs flex items-center space-x-1">
            <FiXCircle className="w-3 h-3" />
            <span>Confirmed Malicious</span>
          </span>
        );
      case 'false_positive':
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs flex items-center space-x-1">
            <FiCheckCircle className="w-3 h-3" />
            <span>False Positive</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full text-xs">
            Unknown
          </span>
        );
    }
  };

  const getThreatIcon = (contentType) => {
    switch(contentType) {
      case 'url':
        return <FiEye className="w-4 h-4" />;
      case 'email':
        return <FiAlertTriangle className="w-4 h-4" />;
      case 'message':
        return <FiAlertTriangle className="w-4 h-4" />;
      case 'file':
        return <FiXCircle className="w-4 h-4" />;
      default:
        return <FiAlertTriangle className="w-4 h-4" />;
    }
  };

  const loadThreatFeed = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/community/threats', {
        // Add token if needed
      });
      
      setThreats(response.threats || []);
      setStats(response.stats || {
        reportedToday: 0,
        confirmedThreats: 0,
        underReview: 0
      });
    } catch (error) {
      console.error('Error loading threat feed:', error);
      // Set mock data for development
      setThreats([
        {
          id: 1,
          contentType: 'url',
          content: 'https://suspicious-site-phishing.com',
          status: 'pending',
          reportCount: 3,
          reportedAt: new Date().toISOString(),
          reporter: 'Anonymous User',
          comment: 'This site looks like a phishing attempt for bank credentials'
        },
        {
          id: 2,
          contentType: 'email',
          content: 'URGENT: Your account will be suspended!',
          status: 'confirmed',
          reportCount: 12,
          reportedAt: new Date(Date.now() - 3600000).toISOString(),
          reporter: 'Security Team',
          comment: 'Classic phishing email with suspicious links'
        },
        {
          id: 3,
          contentType: 'message',
          content: 'Congratulations! You won $1,000,000!',
          status: 'false_positive',
          reportCount: 1,
          reportedAt: new Date(Date.now() - 7200000).toISOString(),
          reporter: 'User123',
          comment: 'This was actually a legitimate marketing message'
        }
      ]);
      setStats({
        reportedToday: 8,
        confirmedThreats: 24,
        underReview: 15
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredThreats = threats.filter(threat => {
    if (filter === 'all') return true;
    return threat.status === filter;
  });

  useEffect(() => {
    loadThreatFeed();
  }, []);

  return (
    <div className="community-threat-feed">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Community Threat Feed</h2>
          <p className="text-gray-400">Real-time threat reports from our community</p>
        </div>
        <button
          onClick={loadThreatFeed}
          className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
          disabled={loading}
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.reportedToday}</div>
              <div className="text-sm text-gray-400">Reported Today</div>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.confirmedThreats}</div>
              <div className="text-sm text-gray-400">Confirmed Threats</div>
            </div>
            <FiXCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.underReview}</div>
              <div className="text-sm text-gray-400">Under Review</div>
            </div>
            <FiClock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-2 mb-6">
        <FiFilter className="w-4 h-4 text-gray-400" />
        <div className="flex space-x-2">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Threat List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading threat feed...</p>
          </div>
        ) : filteredThreats.length === 0 ? (
          <div className="text-center py-8">
            <FiAlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No threats found for this filter</p>
          </div>
        ) : (
          filteredThreats.map(threat => (
            <div key={threat.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getThreatIcon(threat.contentType)}
                    <span className="text-sm text-gray-400 uppercase">{threat.contentType}</span>
                    {getStatusBadge(threat.status)}
                    <span className="text-xs text-gray-500">
                      {threat.reportCount} {threat.reportCount === 1 ? 'report' : 'reports'}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-white font-medium">
                      {threat.contentType === 'url' ? (
                        <a href={threat.content} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {threat.content}
                        </a>
                      ) : (
                        threat.content
                      )}
                    </div>
                  </div>
                  
                  {threat.comment && (
                    <div className="text-sm text-gray-400 mb-2">
                      <span className="font-medium">Reporter Note:</span> {threat.comment}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Reported by {threat.reporter}</span>
                    <span>{new Date(threat.reportedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityThreatFeed;
