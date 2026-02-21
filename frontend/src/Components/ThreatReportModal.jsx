import React, { useState } from 'react';
import { FiX, FiSend, FiAlertTriangle } from 'react-icons/fi';

const ThreatReportModal = ({ isOpen, onClose, onSubmit, scanResult, scanType }) => {
  const [formData, setFormData] = useState({
    contentType: scanType || 'url',
    comment: '',
    isUrgent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contentTypeOptions = [
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'message', label: 'SMS/Message' },
    { value: 'file', label: 'File' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        originalResult: scanResult,
        scanType,
        timestamp: new Date().toISOString()
      });
      
      // Reset form and close modal
      setFormData({
        contentType: scanType || 'url',
        comment: '',
        isUrgent: false
      });
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <FiAlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Report Threat</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type of Content
            </label>
            <select
              value={formData.contentType}
              onChange={(e) => handleInputChange('contentType', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {contentTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Original Content Preview */}
          {scanResult && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Original Content
              </label>
              <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                <div className="text-sm text-gray-400">
                  {scanType === 'url' && scanResult.url}
                  {scanType === 'email' && `Subject: ${scanResult.subject || 'N/A'}`}
                  {scanType === 'message' && scanResult.message_text?.substring(0, 100) + '...'}
                  {scanType === 'file' && scanResult.filename || 'Uploaded file'}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Original Result: {scanResult.prediction} ({scanResult.confidence})
                </div>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Why do you think this is malicious? <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              placeholder="Please describe why you believe this content is malicious or suspicious..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Urgent Flag */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="urgent"
              checked={formData.isUrgent}
              onChange={(e) => handleInputChange('isUrgent', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="urgent" className="text-sm text-gray-300">
              Mark as urgent threat
            </label>
          </div>

          {/* Warning Message */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <FiAlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-300">
                False reports may impact the accuracy of our detection system. Please report only content you genuinely believe to be malicious.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ThreatReportModal;
