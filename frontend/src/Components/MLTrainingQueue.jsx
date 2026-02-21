import React, { useState, useEffect } from 'react';
import { FiDatabase, FiTrendingUp, FiCheckCircle, FiClock, FiRefreshCw, FiPlay } from 'react-icons/fi';
import { apiRequest } from '../api/client';
import { useToast } from './Toast';

const MLTrainingQueue = () => {
  const [queueStats, setQueueStats] = useState({
    pendingItems: 0,
    processedToday: 0,
    accuracyImprovement: 0,
    lastTraining: null
  });
  const [isTraining, setIsTraining] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, showInfo } = useToast();

  const loadQueueStats = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call an API endpoint
      // const response = await apiRequest('/ml/training-stats');
      
      // Mock data for demonstration
      setQueueStats({
        pendingItems: 47,
        processedToday: 23,
        accuracyImprovement: 4.2,
        lastTraining: new Date(Date.now() - 86400000).toISOString()
      });
    } catch (error) {
      console.error('Error loading training stats:', error);
      showError('Failed to load training statistics');
    } finally {
      setLoading(false);
    }
  };

  const startTraining = async () => {
    setIsTraining(true);
    showInfo('Starting ML model training with new data...');
    
    try {
      // Simulate training process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      showSuccess('Model training completed! Accuracy improved by 2.1%');
      setQueueStats(prev => ({
        ...prev,
        pendingItems: 0,
        processedToday: prev.processedToday + 47,
        accuracyImprovement: prev.accuracyImprovement + 2.1,
        lastTraining: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Training failed:', error);
      showError('Model training failed');
    } finally {
      setIsTraining(false);
    }
  };

  useEffect(() => {
    loadQueueStats();
  }, []);

  return (
    <div className="ml-training-queue">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">ML Training Queue</h2>
          <p className="text-gray-400">Active learning system for continuous model improvement</p>
        </div>
        <button
          onClick={loadQueueStats}
          className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
          disabled={loading}
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{queueStats.pendingItems}</div>
              <div className="text-sm text-gray-400">Pending Items</div>
            </div>
            <FiClock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{queueStats.processedToday}</div>
              <div className="text-sm text-gray-400">Processed Today</div>
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">+{queueStats.accuracyImprovement}%</div>
              <div className="text-sm text-gray-400">Accuracy Gain</div>
            </div>
            <FiTrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">
                {queueStats.lastTraining ? 
                  new Date(queueStats.lastTraining).toLocaleDateString() : 
                  'Never'
                }
              </div>
              <div className="text-sm text-gray-400">Last Training</div>
            </div>
            <FiDatabase className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Training Status */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Training Status</h3>
        
        {isTraining ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-400">Training models with new data...</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Processing user feedback</span>
                <span className="text-green-400">✓ Complete</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Analyzing confirmed threats</span>
                <span className="text-yellow-400">⏳ In Progress</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Updating model weights</span>
                <span className="text-gray-500">⏸ Pending</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 mb-2">
                  Ready to train with {queueStats.pendingItems} new data points from user feedback and confirmed threats.
                </p>
                <p className="text-sm text-gray-500">
                  Training typically takes 2-5 minutes and will temporarily use increased CPU resources.
                </p>
              </div>
            </div>
            
            <button
              onClick={startTraining}
              disabled={queueStats.pendingItems === 0 || isTraining}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <FiPlay className="w-4 h-4" />
              <span>Start Training</span>
            </button>
          </div>
        )}
      </div>

      {/* Data Sources */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Training Data Sources</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-white font-medium">User Feedback</div>
                <div className="text-sm text-gray-400">Mark as safe / confirm threat actions</div>
              </div>
            </div>
            <span className="text-sm text-gray-400">High Priority</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <div className="text-white font-medium">Confirmed Threats</div>
                <div className="text-sm text-gray-400">Admin-reviewed malicious content</div>
              </div>
            </div>
            <span className="text-sm text-gray-400">Medium Priority</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="text-white font-medium">False Positives</div>
                <div className="text-sm text-gray-400">Incorrectly flagged safe content</div>
              </div>
            </div>
            <span className="text-sm text-gray-400">Medium Priority</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div>
                <div className="text-white font-medium">Community Reports</div>
                <div className="text-sm text-gray-400">Multiple user reports of same content</div>
              </div>
            </div>
            <span className="text-sm text-gray-400">Low Priority</span>
          </div>
        </div>
      </div>

      {/* Model Performance */}
      <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Model Performance Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">94.7%</div>
            <div className="text-sm text-gray-400">Overall Accuracy</div>
            <div className="text-xs text-green-400">+2.1% from last training</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">91.2%</div>
            <div className="text-sm text-gray-400">Precision</div>
            <div className="text-xs text-blue-400">+1.8% from last training</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">96.3%</div>
            <div className="text-sm text-gray-400">Recall</div>
            <div className="text-xs text-yellow-400">+2.4% from last training</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLTrainingQueue;
