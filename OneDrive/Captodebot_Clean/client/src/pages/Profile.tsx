import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface GPUUsage {
  usedMinutes: number;
  quotaMinutes: number;
  remainingMinutes: number;
  date: string;
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [gpuUsage, setGpuUsage] = useState<GPUUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await axios.get('/api/gpu/usage');
      setGpuUsage(response.data);
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {user?.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">{user?.email}</h2>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user?.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                  <p className="text-sm text-gray-900">Student Account</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Daily GPU Quota</h3>
                  <p className="text-sm text-gray-900">{gpuUsage?.quotaMinutes || 60} minutes</p>
                </div>
              </div>

              <div className="mt-6">
                <button onClick={logout} className="w-full btn-outline">
                  Logout
                </button>
              </div>
            </div>

            {gpuUsage && (
              <div className="bg-white rounded-lg shadow mt-6 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Usage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Used</span>
                    <span className="font-medium">{gpuUsage.usedMinutes} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remaining</span>
                    <span className="font-medium">{gpuUsage.remainingMinutes} min</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary-blue h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(gpuUsage.usedMinutes / gpuUsage.quotaMinutes) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Session Billing</h2>
              <div className="text-center py-8">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Billing Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This is a demo platform. No actual billing is processed.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary-blue">{gpuUsage?.usedMinutes || 0}</p>
                    <p className="text-xs text-gray-500">Minutes Used</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary-pink">${((gpuUsage?.usedMinutes || 0) * 0.01).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Est. Cost</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{gpuUsage?.remainingMinutes || 60}</p>
                    <p className="text-xs text-gray-500">Minutes Left</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
