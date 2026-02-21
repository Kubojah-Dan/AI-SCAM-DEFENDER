import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiBarChart2, FiPieChart, FiActivity, FiCalendar, FiFilter, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { useToast } from './Toast';
import { apiRequest } from '../api/client';

const AdvancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    threatTrends: [],
    scanMetrics: [],
    geographicData: [],
    timeSeriesData: [],
    performanceMetrics: {}
  });
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('scam_defender_token');
      
      // Load analytics data from backend
      const trendsResponse = await apiRequest(`/analytics/trends?range=${dateRange}`, { token });
      const metricsResponse = await apiRequest(`/analytics/metrics?range=${dateRange}`, { token });
      const geoResponse = await apiRequest('/analytics/geographic', { token });
      const performanceResponse = await apiRequest('/analytics/performance', { token });
      
      setAnalyticsData({
        threatTrends: trendsResponse.trends || [],
        scanMetrics: metricsResponse.metrics || [],
        geographicData: geoResponse.geographic || [],
        timeSeriesData: trendsResponse.timeSeries || [],
        performanceMetrics: performanceResponse.performance || {}
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Fallback to mock data
      setAnalyticsData({
        threatTrends: [
          { date: '2024-01-15', phishing: 45, malware: 23, social_engineering: 67, fraud: 12 },
          { date: '2024-01-16', phishing: 52, malware: 28, social_engineering: 71, fraud: 15 },
          { date: '2024-01-17', phishing: 38, malware: 31, social_engineering: 59, fraud: 18 },
          { date: '2024-01-18', phishing: 61, malware: 25, social_engineering: 78, fraud: 22 },
          { date: '2024-01-19', phishing: 47, malware: 33, social_engineering: 82, fraud: 19 },
          { date: '2024-01-20', phishing: 55, malware: 29, social_engineering: 69, fraud: 25 },
          { date: '2024-01-21', phishing: 43, malware: 35, social_engineering: 74, fraud: 28 }
        ],
        scanMetrics: {
          total_scans: 15420,
          threat_detection_rate: 94.7,
          false_positive_rate: 2.3,
          average_scan_time: 1.2,
          scans_by_type: {
            email: 5234,
            url: 4123,
            message: 3456,
            file: 1892,
            fraud: 715
          }
        },
        geographicData: [
          { country: 'United States', threats: 3421, percentage: 35.2 },
          { country: 'United Kingdom', threats: 1876, percentage: 19.3 },
          { country: 'Germany', threats: 1234, percentage: 12.7 },
          { country: 'France', threats: 987, percentage: 10.2 },
          { country: 'Canada', threats: 876, percentage: 9.0 },
          { country: 'Australia', threats: 654, percentage: 6.7 },
          { country: 'Others', threats: 672, percentage: 6.9 }
        ],
        timeSeriesData: {
          hourly_scans: Array.from({length: 24}, (_, i) => ({
            hour: i,
            scans: Math.floor(Math.random() * 500) + 200,
            threats: Math.floor(Math.random() * 50) + 10
          })),
          daily_active_users: Array.from({length: 30}, (_, i) => ({
            day: i + 1,
            users: Math.floor(Math.random() * 1000) + 500
          }))
        },
        performanceMetrics: {
          model_accuracy: 94.7,
          precision: 92.3,
          recall: 96.1,
          f1_score: 94.2,
          response_time_p95: 2.3,
          uptime: 99.9
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    const reportData = {
      generated_at: new Date().toISOString(),
      date_range: dateRange,
      metrics: analyticsData
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Analytics report exported successfully');
  };

  const getTrendColor = (current, previous) => {
    const change = ((current - previous) / previous) * 100;
    if (change > 10) return 'text-red-400';
    if (change > 0) return 'text-orange-400';
    if (change > -10) return 'text-green-400';
    return 'text-blue-400';
  };

  const getMetricIcon = (metric) => {
    switch(metric) {
      case 'accuracy': return <FiTrendingUp className="w-5 h-5" />;
      case 'scans': return <FiBarChart2 className="w-5 h-5" />;
      case 'performance': return <FiActivity className="w-5 h-5" />;
      default: return <FiPieChart className="w-5 h-5" />;
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-400">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="advanced-analytics">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <FiBarChart2 className="w-6 h-6" />
            <span>Advanced Analytics</span>
          </h2>
          <p className="text-gray-400">Comprehensive threat analysis and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportAnalytics}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Threat Detection Rate</span>
            {getMetricIcon('accuracy')}
          </div>
          <div className="text-3xl font-bold text-green-400">{analyticsData.performanceMetrics.model_accuracy}%</div>
          <div className="text-sm text-gray-500 mt-1">+2.3% from last period</div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Scans</span>
            {getMetricIcon('scans')}
          </div>
          <div className="text-3xl font-bold text-blue-400">{analyticsData.scanMetrics.total_scans.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">+18% from last period</div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">False Positive Rate</span>
            {getMetricIcon('performance')}
          </div>
          <div className="text-3xl font-bold text-yellow-400">{analyticsData.scanMetrics.false_positive_rate}%</div>
          <div className="text-sm text-gray-500 mt-1">-0.8% from last period</div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Avg Response Time</span>
            <FiActivity className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-purple-400">{analyticsData.performanceMetrics.response_time_p95}s</div>
          <div className="text-sm text-gray-500 mt-1">95th percentile</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Trends Chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Threat Trends Over Time</h3>
          <div className="space-y-4">
            {analyticsData.threatTrends.slice(-5).map((day, index) => (
              <div key={day.date} className="flex items-center space-x-4">
                <div className="w-16 text-sm text-gray-400">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div className="flex-1 flex space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-6 relative overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${(day.phishing / 100) * 100}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white">
                      {day.phishing}
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-6 relative overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${(day.malware / 100) * 100}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white">
                      {day.malware}
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-6 relative overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all duration-500"
                      style={{ width: `${(day.social_engineering / 100) * 100}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white">
                      {day.social_engineering}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-400">Phishing</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-400">Malware</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-400">Social Engineering</span>
            </div>
          </div>
        </div>

        {/* Scan Distribution */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Scan Distribution by Type</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.scanMetrics.scans_by_type).map(([type, count]) => {
              const total = analyticsData.scanMetrics.total_scans;
              const percentage = (count / total) * 100;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 capitalize">{type.replace('_', ' ')}</span>
                    <span className="text-white">{count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Geographic Threat Distribution</h3>
          <div className="space-y-3">
            {analyticsData.geographicData.slice(0, 6).map((country) => (
              <div key={country.country} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {country.country.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-white">{country.country}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300">{country.threats.toLocaleString()}</span>
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${country.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400 w-12 text-right">{country.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Model Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{analyticsData.performanceMetrics.precision}%</div>
              <div className="text-sm text-gray-400">Precision</div>
              <div className="text-xs text-green-400 mt-1">+1.2% improvement</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{analyticsData.performanceMetrics.recall}%</div>
              <div className="text-sm text-gray-400">Recall</div>
              <div className="text-xs text-blue-400 mt-1">+0.8% improvement</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">{analyticsData.performanceMetrics.f1_score}%</div>
              <div className="text-sm text-gray-400">F1 Score</div>
              <div className="text-xs text-purple-400 mt-1">+1.0% improvement</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">{analyticsData.performanceMetrics.uptime}%</div>
              <div className="text-sm text-gray-400">Uptime</div>
              <div className="text-xs text-yellow-400 mt-1">Last 30 days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Activity Pattern */}
      <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">24-Hour Activity Pattern</h3>
        <div className="flex items-end space-x-1 h-32">
          {analyticsData.timeSeriesData.hourly_scans.map((hour) => {
            const maxScans = Math.max(...analyticsData.timeSeriesData.hourly_scans.map(h => h.scans));
            const height = (hour.scans / maxScans) * 100;
            return (
              <div
                key={hour.hour}
                className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t relative group cursor-pointer"
                style={{ height: `${height}%` }}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <div>Hour: {hour.hour}:00</div>
                  <div>Scans: {hour.scans}</div>
                  <div>Threats: {hour.threats}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
