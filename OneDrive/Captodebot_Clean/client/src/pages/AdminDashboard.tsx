import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface UserUsage {
  id: number;
  email: string;
  role: string;
  used_minutes: number;
  quotaMinutes: number;
  remainingMinutes: number;
  date: string;
}

interface GPUStats {
  timestamp: string;
  gpus: Array<{
    id: number;
    name: string;
    temperature: number;
    utilization: number;
    memoryUsed: number;
    memoryTotal: number;
    powerUsage: number;
    status: string;
  }>;
  activeUsers: number;
  totalSessions: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserUsage[]>([]);
  const [gpuStats, setGpuStats] = useState<GPUStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchGPUStats();
    
    const interval = setInterval(() => {
      fetchGPUStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/gpu/admin/usage/all');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchGPUStats = async () => {
    try {
      const response = await axios.get('/api/gpu/stats');
      setGpuStats(response.data);
    } catch (err) {
      console.error('Error fetching GPU stats:', err);
    }
  };

  const resetUserQuota = async (userId: number) => {
    try {
      await axios.post('/api/gpu/admin/quota/reset', { userId });
      await fetchUsers();
      alert('User quota reset successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset quota');
    }
  };

  const toggleUserStatus = async (userId: number, enabled: boolean) => {
    try {
      await axios.put(`/api/gpu/admin/user/${userId}/toggle`, { enabled });
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle user status');
    }
  };

  const totalUsage = users.reduce((sum, user) => sum + user.used_minutes, 0);
  const totalQuota = users.reduce((sum, user) => sum + user.quotaMinutes, 0);
  const activeUsers = users.filter(user => user.used_minutes > 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage users and monitor GPU usage across the platform.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Users Today</h3>
            <p className="text-2xl font-bold text-primary-blue">{activeUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total GPU Hours Used</h3>
            <p className="text-2xl font-bold text-primary-pink">{(totalUsage / 60).toFixed(1)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">System Utilization</h3>
            <p className="text-2xl font-bold text-green-600">
              {totalQuota > 0 ? ((totalUsage / totalQuota) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* GPU Stats */}
        {gpuStats && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">System GPU Status</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-blue">{gpuStats.activeUsers}</p>
                  <p className="text-sm text-gray-500">Active Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-pink">{gpuStats.totalSessions}</p>
                  <p className="text-sm text-gray-500">Total Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{gpuStats.gpus.length}</p>
                  <p className="text-sm text-gray-500">Available GPUs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {gpuStats.gpus.reduce((sum, gpu) => sum + gpu.utilization, 0) / gpuStats.gpus.length}%
                  </p>
                  <p className="text-sm text-gray-500">Avg Utilization</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage Today
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage % 
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.used_minutes} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.remainingMinutes} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              user.used_minutes / user.quotaMinutes > 0.8 
                                ? 'bg-red-500' 
                                : user.used_minutes / user.quotaMinutes > 0.5 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (user.used_minutes / user.quotaMinutes) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">
                          {((user.used_minutes / user.quotaMinutes) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => resetUserQuota(user.id)}
                          className="text-primary-blue hover:text-blue-600"
                        >
                          Reset Quota
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, false)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Disable
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
