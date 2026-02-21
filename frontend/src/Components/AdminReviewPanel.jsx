import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiAlertTriangle, FiUser, FiMessageSquare, FiRefreshCw, FiFilter } from 'react-icons/fi';
import { apiRequest } from '../api/client';
import { useToast } from './Toast';

const AdminReviewPanel = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState({});
  const { showSuccess, showError } = useToast();

  const filterOptions = [
    { value: 'all', label: 'All Reports' },
    { value: 'urgent', label: 'Urgent Only' },
    { value: 'high_count', label: 'High Report Count' }
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
            <span>Confirmed Threat</span>
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
        return null;
    }
  };

  const getContentTypeIcon = (contentType) => {
    switch(contentType) {
      case 'url':
        return <FiAlertTriangle className="w-4 h-4 text-blue-400" />;
      case 'email':
        return <FiMessageSquare className="w-4 h-4 text-yellow-400" />;
      case 'message':
        return <FiMessageSquare className="w-4 h-4 text-green-400" />;
      case 'file':
        return <FiXCircle className="w-4 h-4 text-red-400" />;
      default:
        return <FiAlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/admin/review-reports');
      setReports(response.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      showError('Failed to load admin reports');
      // Set mock data for development
      setReports([
        {
          id: 1,
          contentType: 'url',
          content: 'https://suspicious-phishing-site.com/login',
          reportCount: 5,
          isUrgent: true,
          reportedAt: new Date().toISOString(),
          reporter: 'User123',
          comment: 'This looks like a bank phishing site',
          originalResult: { prediction: 'safe', confidence: '85%' }
        },
        {
          id: 2,
          contentType: 'email',
          content: 'Subject: URGENT: Account Suspension Notice',
          reportCount: 3,
          isUrgent: false,
          reportedAt: new Date(Date.now() - 3600000).toISOString(),
          reporter: 'SecurityConscious',
          comment: 'Classic email scam with suspicious links',
          originalResult: { prediction: 'spam', confidence: '92%' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (reportId, action, notes) => {
    setProcessing(prev => ({ ...prev, [reportId]: true }));
    
    try {
      await apiRequest(`/admin/review-report/${reportId}`, {
        method: 'POST',
        body: { action, notes }
      });
      
      showSuccess(`Report marked as ${action === 'confirm' ? 'confirmed threat' : 'false positive'}`);
      
      // Remove the report from the list
      setReports(prev => prev.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error reviewing report:', error);
      showError('Failed to process review action');
    } finally {
      setProcessing(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return report.isUrgent;
    if (filter === 'high_count') return report.reportCount >= 3;
    return true;
  });

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="admin-review-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Review Panel</h2>
          <p className="text-gray-400">Review and moderate community threat reports</p>
        </div>
        <button
          onClick={loadReports}
          className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
          disabled={loading}
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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
        <span className="text-sm text-gray-400 ml-4">
          {filteredReports.length} reports
        </span>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8">
            <FiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-400">No reports to review</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <div key={report.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getContentTypeIcon(report.contentType)}
                  <span className="text-sm text-gray-400 uppercase">{report.contentType}</span>
                  {report.isUrgent && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs">
                      Urgent
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {report.reportCount} {report.reportCount === 1 ? 'report' : 'reports'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusBadge('pending')}
                  <span className="text-xs text-gray-500">
                    {new Date(report.reportedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="mb-3">
                <div className="text-white font-medium mb-1">
                  {report.contentType === 'url' ? (
                    <a href={report.content} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {report.content}
                    </a>
                  ) : (
                    report.content
                  )}
                </div>
                
                {report.originalResult && (
                  <div className="text-xs text-gray-500 mt-1">
                    Original Result: {report.originalResult.prediction} ({report.originalResult.confidence})
                  </div>
                )}
              </div>

              {/* Reporter Info */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <FiUser className="w-3 h-3" />
                  <span>{report.reporter}</span>
                </div>
                {report.comment && (
                  <div className="flex items-center space-x-1">
                    <FiMessageSquare className="w-3 h-3" />
                    <span>Has comment</span>
                  </div>
                )}
              </div>

              {/* Comment */}
              {report.comment && (
                <div className="mb-3 p-2 bg-gray-700/50 rounded text-sm text-gray-300">
                  <span className="font-medium">Reporter Note:</span> {report.comment}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleReviewAction(report.id, 'confirm', 'Confirmed as malicious threat')}
                  disabled={processing[report.id]}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing[report.id] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiXCircle className="w-4 h-4" />
                      <span>Confirm Threat</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleReviewAction(report.id, 'mark_false_positive', 'Marked as false positive')}
                  disabled={processing[report.id]}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing[report.id] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      <span>False Positive</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Review Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{reports.filter(r => r.isUrgent).length}</div>
            <div className="text-sm text-gray-400">Urgent Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {reports.reduce((sum, r) => sum + r.reportCount, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{filteredReports.length}</div>
            <div className="text-sm text-gray-400">Pending Review</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewPanel;
