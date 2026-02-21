import React, { useState, useCallback } from 'react';
import { FiShield, FiUpload, FiMail, FiAlertTriangle, FiCheckCircle, FiXCircle, FiClock, FiFile, FiLink, FiActivity } from 'react-icons/fi';
import { apiRequest } from '../api/client';
import { useToast } from './Toast';

const SandboxAnalysis = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [emailContent, setEmailContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState([]);
  const { showSuccess, showError, showInfo } = useToast();

  const analyzeEmail = useCallback(async () => {
    if (!emailContent.trim()) {
      showError('Please enter email content to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await apiRequest('/analyze-email', {
        method: 'POST',
        body: {
          content: emailContent,
          headers: {
            'From': 'test@example.com' // Would be extracted from real email
          }
        }
      });

      setAnalysis(result);
      showSuccess('Email analysis completed successfully');
      loadHistory();
    } catch (error) {
      showError('Email analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [emailContent]);

  const analyzeFile = useCallback(async () => {
    if (!selectedFile) {
      showError('Please select a file to analyze');
      return;
    }

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const result = await apiRequest('/analyze-file', {
        method: 'POST',
        body: formData
      });

      setAnalysis(result);
      showSuccess('File analysis completed successfully');
      loadHistory();
      setSelectedFile(null);
    } catch (error) {
      showError('File analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile]);

  const loadHistory = useCallback(async () => {
    try {
      const result = await apiRequest('/analysis-history');
      setHistory(result.history || []);
    } catch (error) {
      showError('Failed to load analysis history');
    }
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'safe':
        return <FiCheckCircle className="w-5 h-5 text-green-400" />;
      case 'suspicious':
        return <FiAlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'malicious':
        return <FiXCircle className="w-5 h-5 text-red-400" />;
      default:
        return <FiActivity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe':
        return 'text-green-400';
      case 'suspicious':
        return 'text-yellow-400';
      case 'malicious':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSeverityColor = (score) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-orange-400';
    if (score >= 25) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 border border border-gray-700 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <FiShield className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-2xl font-bold text-white">Secure Sandbox Analysis</h1>
            <p className="text-gray-300">Analyze emails and files in a fully isolated sandbox environment</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'email'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <FiMail className="inline mr-2" />
              Email Analysis
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'file'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <FiUpload className="inline mr-2" />
              File Analysis
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <FiClock className="inline mr-2" />
              History
            </button>
          </div>

          {/* Email Analysis Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Content
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Paste email content here for secure sandbox analysis..."
                  className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={analyzeEmail}
                disabled={isAnalyzing || !emailContent.trim()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent border-r-transparent animate-spin rounded-full mr-2"></div>
                    Analyzing in Sandbox...
                  </>
                ) : (
                  <>
                    <FiShield className="mr-2" />
                    Analyze Email
                  </>
                )}
              </button>
            </div>
          )}

          {/* File Analysis Tab */}
          {activeTab === 'file' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload File for Analysis
                </label>
                <div className="flex items-center justify-center w-full">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex items-center space-x-2">
                        <FiFile className="text-blue-400" />
                        <span className="text-white">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <FiUpload className="mx-auto mb-2" />
                        <span>Click to upload file or drag and drop</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <button
                onClick={analyzeFile}
                disabled={isAnalyzing || !selectedFile}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent border-r-transparent animate-spin rounded-full mr-2"></div>
                    Analyzing in Sandbox...
                  </>
                ) : (
                  <>
                    <FiShield className="mr-2" />
                    Analyze File
                  </>
                )}
              </button>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-4">Analysis History</h3>
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FiClock className="mx-auto mb-2" />
                  <p>No analysis history found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <div key={item.id} className="bg-gray-700 border border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.verdict)}
                          <span className={`font-medium ${getStatusColor(item.verdict)}`}>
                            {item.verdict.toUpperCase()}
                          </span>
                        </div>
                        <div className={`text-sm ${getSeverityColor(item.risk_score)}`}>
                          Risk Score: {item.risk_score}/100
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">
                        <p className="font-medium mb-1">{item.scan_type.toUpperCase()} SCAN</p>
                        <p className="text-xs">{item.input_excerpt}</p>
                        <p className="text-xs mt-2">{item.details}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="mt-6 bg-gray-700 border border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Analysis Results</h3>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(analysis.status)}
                  <span className={`font-bold text-xl ${getStatusColor(analysis.status)}`}>
                    {analysis.status.toUpperCase()}
                  </span>
                  <div className={`text-2xl font-bold ${getSeverityColor(analysis.risk_score)}`}>
                    {analysis.risk_score}/100
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-2">Threat Type</h4>
                  <p className="text-gray-300">{analysis.threat_type}</p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Risk Explanation</h4>
                  <p className="text-gray-300 text-sm">{analysis.explanation}</p>
                </div>
              </div>

              {/* Static Analysis Details */}
              {analysis.static_analysis && (
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-2">Static Analysis</h4>
                  <div className="bg-gray-800 rounded p-4 space-y-2">
                    {analysis.static_analysis.indicators && analysis.static_analysis.indicators.length > 0 && (
                      <div>
                        <h5 className="text-yellow-400 font-medium mb-1">Indicators Found:</h5>
                        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                          {analysis.static_analysis.indicators.map((indicator, index) => (
                            <li key={index}>{indicator}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.static_analysis.file_type && (
                      <div>
                        <h5 className="text-blue-400 font-medium mb-1">File Type:</h5>
                        <p className="text-gray-300 text-sm">{analysis.static_analysis.file_type}</p>
                      </div>
                    )}
                    {analysis.static_analysis.file_hash && (
                      <div>
                        <h5 className="text-green-400 font-medium mb-1">File Hash:</h5>
                        <p className="text-gray-300 text-sm font-mono">{analysis.static_analysis.file_hash}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* URLs and Attachments */}
              {(analysis.urls && analysis.urls.length > 0) || (analysis.attachments && analysis.attachments.length > 0) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.urls && analysis.urls.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2">URLs Found</h4>
                      <div className="space-y-2">
                        {analysis.urls.map((url, index) => (
                          <div key={index} className="bg-gray-800 rounded p-3">
                            <p className="text-blue-400 text-sm font-mono break-all">{url.url}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-gray-300 text-xs">Risk: {url.risk_score}/100</span>
                              {url.indicators && url.indicators.length > 0 && (
                                <span className="text-yellow-400 text-xs">
                                  ({url.indicators.join(', ')})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.attachments && analysis.attachments.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {analysis.attachments.map((attachment, index) => (
                          <div key={index} className="bg-gray-800 rounded p-3">
                            <p className="text-gray-300 text-sm font-medium">{attachment.filename}</p>
                            <div className="text-xs text-gray-400">
                              Status: {attachment.status} | Risk: {attachment.risk_score}/100
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Analysis Metadata */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="text-sm text-gray-400">
                  <p>Analysis ID: {analysis.analysis_id}</p>
                  <p>Timestamp: {new Date(analysis.timestamp).toLocaleString()}</p>
                  <p>Sandbox Path: {analysis.sandbox_path}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SandboxAnalysis;
