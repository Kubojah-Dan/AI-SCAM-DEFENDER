import React, { useState } from 'react';
import AppShell from '../Components/AppShell';
import { useToast } from '../Components/Toast';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { FiAlertTriangle, FiMail, FiMessageSquare, FiLink, FiFile, FiCreditCard, FiSend } from 'react-icons/fi';

export default function ThreatReportPage() {
  const { token } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [reportData, setReportData] = useState({
    threatType: 'email',
    title: '',
    description: '',
    content: '',
    severity: 'medium',
    isUrgent: false,
    attachments: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const threatTypes = [
    { value: 'email', label: 'Malicious Email', icon: FiMail, color: 'text-red-400' },
    { value: 'message', label: 'Suspicious Message', icon: FiMessageSquare, color: 'text-blue-400' },
    { value: 'url', label: 'Malicious URL', icon: FiLink, color: 'text-purple-400' },
    { value: 'file', label: 'Malicious File', icon: FiFile, color: 'text-orange-400' },
    { value: 'fraud', label: 'Fraud Attempt', icon: FiCreditCard, color: 'text-green-400' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low Risk', color: 'text-green-400' },
    { value: 'medium', label: 'Medium Risk', color: 'text-yellow-400' },
    { value: 'high', label: 'High Risk', color: 'text-orange-400' },
    { value: 'critical', label: 'Critical Risk', color: 'text-red-400' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportData.content.trim()) {
      showError('Please provide the threat content to report');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await apiRequest('/report-threat', {
        method: 'POST',
        token,
        body: {
          content_type: reportData.threatType,
          content: reportData.content,
          title: reportData.title,
          description: reportData.description,
          severity: reportData.severity,
          is_urgent: reportData.isUrgent,
          reporter_name: localStorage.getItem('userName') || 'Anonymous',
          timestamp: new Date().toISOString()
        }
      });

      showSuccess('Threat report submitted successfully! Thank you for helping keep our community safe.');
      setSubmitSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setReportData({
          threatType: 'email',
          title: '',
          description: '',
          content: '',
          severity: 'medium',
          isUrgent: false,
          attachments: []
        });
      }, 3000);

    } catch (error) {
      console.error('Error submitting threat report:', error);
      showError('Failed to submit threat report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (submitSuccess) {
    return (
      <AppShell title="Threat Report Submitted">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-green-400 mb-4">Report Submitted Successfully!</h2>
            <p className="text-gray-300 mb-6">
              Your threat report has been received and is being reviewed by our security team. 
              This information will help protect other users from similar threats.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">What Happens Next?</h3>
                <p className="text-gray-400 text-sm">Our team will analyze the threat and add it to our threat intelligence database.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">Community Impact</h3>
                <p className="text-gray-400 text-sm">Your report helps protect thousands of other users from this threat.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">Follow Up</h3>
                <p className="text-gray-400 text-sm">You can check the status of your report in the community feed.</p>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Report Malicious Threat">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <FiAlertTriangle className="w-8 h-8 text-orange-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Report a Malicious Threat</h2>
              <p className="text-gray-400">Help protect our community by reporting suspicious activities</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Threat Type Selection */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Threat Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {threatTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('threatType', type.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      reportData.threatType === type.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${type.color}`} />
                    <p className="text-white text-sm">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Threat Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={reportData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Brief description of the threat"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Description *</label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Detailed description of what happened"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Threat Content *</label>
                <textarea
                  value={reportData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  rows={4}
                  placeholder={`Paste the ${reportData.threatType} content here...`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Severity and Urgency */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Assessment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Severity Level</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {severityLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleInputChange('severity', level.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        reportData.severity === level.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <p className={`font-semibold ${level.color}`}>{level.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={reportData.isUrgent}
                  onChange={(e) => handleInputChange('isUrgent', e.target.checked)}
                  className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isUrgent" className="text-gray-300">
                  Mark as urgent (requires immediate attention)
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FiSend className="w-5 h-5" />
                  <span>Submit Threat Report</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Why Report Threats?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <h4 className="text-white font-semibold mb-2">Protect Others</h4>
              <p className="text-gray-400 text-sm">Your reports help prevent others from falling victim to similar threats.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🤖</div>
              <h4 className="text-white font-semibold mb-2">Improve AI Models</h4>
              <p className="text-gray-400 text-sm">Reports help train our ML models to detect new threat patterns.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌐</div>
              <h4 className="text-white font-semibold mb-2">Community Safety</h4>
              <p className="text-gray-400 text-sm">Together we create a safer digital environment for everyone.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
