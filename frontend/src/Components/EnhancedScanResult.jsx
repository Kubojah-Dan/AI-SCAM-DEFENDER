import React, { useState } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const EnhancedScanResult = ({ result, scanType, onReportThreat, onMarkSafe }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!result) return null;

  // Determine status and styling
  const getStatusInfo = () => {
    const prediction = result.prediction?.toLowerCase();
    const confidence = parseFloat(result.confidence) || 0;
    
    if (prediction === 'safe' || prediction === 'benign' || prediction === 'ham') {
      return {
        status: 'Safe',
        color: 'green',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500',
        textColor: 'text-green-400',
        icon: FiCheckCircle,
        riskScore: Math.max(0, 100 - confidence)
      };
    } else if (prediction === 'suspicious' || prediction === 'spam' || prediction === 'uncertain') {
      return {
        status: 'Suspicious',
        color: 'yellow',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
        icon: FiAlertTriangle,
        riskScore: confidence
      };
    } else {
      return {
        status: 'Malicious',
        color: 'red',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500',
        textColor: 'text-red-400',
        icon: FiXCircle,
        riskScore: confidence
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Get threat type based on scan type and prediction
  const getThreatType = () => {
    const prediction = result.prediction?.toLowerCase();
    
    switch(scanType) {
      case 'email':
        if (prediction === 'spam') return 'Phishing/Spam';
        if (prediction === 'scam') return 'Email Scam';
        return 'Clean Email';
      case 'message':
        if (prediction === 'scam') return 'SMS Scam';
        if (prediction === 'spam') return 'Message Spam';
        return 'Safe Message';
      case 'url':
        if (prediction === 'scam') return 'Malicious URL';
        if (prediction === 'phishing') return 'Phishing Site';
        return 'Safe URL';
      case 'file':
        if (prediction === 'malware') return 'Malware';
        if (prediction === 'virus') return 'Virus';
        return 'Benign File';
      case 'fraud':
        if (prediction === 'fraud') return 'Fraudulent Transaction';
        return 'Legitimate Transaction';
      default:
        return prediction === 'safe' ? 'Safe Content' : 'Threat Detected';
    }
  };

  // Generate explanation based on scan type and result
  const getExplanation = () => {
    const prediction = result.prediction?.toLowerCase();
    
    if (prediction === 'safe' || prediction === 'benign' || prediction === 'ham') {
      switch(scanType) {
        case 'email':
          return 'No phishing indicators or spam patterns detected. Email appears legitimate.';
        case 'message':
          return 'No scam patterns or suspicious content found in this message.';
        case 'url':
          return 'URL structure and reputation analysis indicate this is a safe destination.';
        case 'file':
          return 'File analysis shows no malicious code or suspicious behavior patterns.';
        case 'fraud':
          return 'Transaction patterns appear normal and within expected behavior.';
        default:
          return 'Content appears safe based on our analysis.';
      }
    } else {
      switch(scanType) {
        case 'email':
          return 'Detected phishing indicators, suspicious links, or spam patterns in the email content.';
        case 'message':
          return 'Message contains scam patterns, suspicious requests, or fraudulent content.';
        case 'url':
          return 'URL shows characteristics of malicious sites, suspicious domains, or phishing attempts.';
        case 'file':
          return 'File exhibits behavior patterns associated with malware or suspicious code.';
        case 'fraud':
          return 'Transaction shows anomalies or patterns consistent with fraudulent activity.';
        default:
          return 'Content shows indicators of malicious or suspicious activity.';
      }
    }
  };

  return (
    <div className={`enhanced-scan-result ${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-4 mb-4 transition-all duration-300`}>
      {/* Header with Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <StatusIcon className={`w-6 h-6 ${statusInfo.textColor}`} />
          <div>
            <span className={`text-lg font-semibold ${statusInfo.textColor}`}>
              {statusInfo.status}
            </span>
            <div className="text-sm text-gray-400">
              {getThreatType()}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${statusInfo.textColor}`}>
            {statusInfo.riskScore.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Risk Score</div>
        </div>
      </div>

      {/* Confidence and Timestamp */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <div className="text-gray-400">
          Confidence: {result.confidence}
        </div>
        <div className="text-gray-400">
          {result.timestamp ? new Date(result.timestamp).toLocaleString() : 'Just now'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mb-3">
        {statusInfo.status === 'Safe' && (
          <button
            onClick={() => onReportThreat && onReportThreat(result, scanType)}
            className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-sm hover:bg-red-500/30 transition-colors"
          >
            Report as Not Safe
          </button>
        )}
        
        {(statusInfo.status === 'Suspicious' || statusInfo.status === 'Malicious') && (
          <button
            onClick={() => onMarkSafe && onMarkSafe(result, scanType)}
            className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md text-sm hover:bg-green-500/30 transition-colors"
          >
            Mark as Safe
          </button>
        )}
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md text-sm hover:bg-blue-500/30 transition-colors flex items-center space-x-1"
        >
          <FiInfo className="w-3 h-3" />
          <span>Details</span>
          {showDetails ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Detailed Analysis Panel */}
      {showDetails && (
        <div className="mt-4 p-3 bg-black/30 rounded-md border border-gray-700">
          <h4 className="text-white font-semibold mb-2">Detailed Analysis</h4>
          
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400 mb-1">Risk Assessment</div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    statusInfo.status === 'Safe' ? 'bg-green-500' :
                    statusInfo.status === 'Suspicious' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${statusInfo.riskScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Threat Classification</div>
              <div className="text-white">{getThreatType()}</div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Analysis Explanation</div>
              <div className="text-gray-300 text-sm">{getExplanation()}</div>
            </div>

            {result.features && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Key Indicators</div>
                <div className="text-gray-300 text-sm">
                  {Object.entries(result.features).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedScanResult;
