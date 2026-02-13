import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface GPUUsage {
  userId: number;
  date: string;
  usedMinutes: number;
  quotaMinutes: number;
  remainingMinutes: number;
}

interface GPUStats {
  activeUsers: number;
  totalSessions: number;
  gpus: Array<{
    id: string;
    name: string;
    temperature: number;
    utilization: number;
    memoryUsed: number;
    memoryTotal: number;
    powerUsage: number;
    status: string;
  }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [code, setCode] = useState(`# Welcome to GPU Dashboard
# Write your Python code here
import numpy as np
import matplotlib.pyplot as plt

# Example: Create a simple plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y)
plt.title('Sine Wave')
plt.xlabel('X')
plt.ylabel('Y')
plt.grid(True)
plt.show()

print("Hello from GPU-accelerated Python!")`);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [gpuUsage, setGpuUsage] = useState<GPUUsage | null>(null);
  const [gpuStats, setGpuStats] = useState<GPUStats | null>(null);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showInputPrompt, setShowInputPrompt] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [currentInputPrompt, setCurrentInputPrompt] = useState('');

  useEffect(() => {
    fetchGPUUsage();
    fetchGPUStats();
    
    const interval = setInterval(() => {
      fetchGPUStats();
    }, 5000); // Update GPU stats every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchGPUUsage = async () => {
    try {
      const response = await axios.get('/api/gpu/usage');
      setGpuUsage(response.data);
    } catch (error) {
      console.error('Error fetching GPU usage:', error);
    }
  };

  const fetchGPUStats = async () => {
    try {
      const response = await axios.get('/api/gpu/stats');
      setGpuStats(response.data);
    } catch (error) {
      console.error('Error fetching GPU stats:', error);
    }
  };

  const runCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code to run');
      return;
    }

    setIsRunning(true);
    setError('');
    setOutput('');

    try {
      // Start GPU execution
      const startResponse = await axios.post('/api/gpu/execute/start', {
        sessionId: uuidv4()
      });

      if (startResponse.data.success) {
        setSessionId(startResponse.data.sessionId);
        
        // Execute code
        const executeResponse = await axios.post('/api/workspace/execute', {
          code: code
        });

        if (executeResponse.data.success) {
          setOutput(executeResponse.data.output);
        } else {
          setError(executeResponse.data.error || 'Execution failed');
        }

        // Stop GPU execution
        await axios.post('/api/gpu/execute/stop', {
          sessionId: startResponse.data.sessionId
        });
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to execute code');
    } finally {
      setIsRunning(false);
      setSessionId(null);
    }
  };

  const submitUserInput = async () => {
    if (!userInput.trim()) return;

    console.log('Submitting user input:', userInput);
    
    // Here you would typically send the input to the backend
    // For now, just clear the input
    setUserInput('');
    setShowInputPrompt(false);
    setCurrentInputPrompt('');
  };

  const clearOutput = () => {
    setOutput('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GPU Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.email}! Run your Python code with GPU acceleration.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* GPU Usage Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 7H7v6h6V7z"/>
                    <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Daily GPU Usage</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {gpuUsage ? `${gpuUsage.usedMinutes}/${gpuUsage.quotaMinutes} min` : 'Loading...'}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {gpuUsage ? `${gpuUsage.remainingMinutes} min remaining` : ''}
                  </dd>
                </dl>
              </div>
            </div>
            {gpuUsage && (
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Usage</span>
                  <span className="font-medium">{Math.round((gpuUsage.usedMinutes / gpuUsage.quotaMinutes) * 100)}%</span>
                </div>
                <div className="mt-1">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-blue h-2 rounded-full" 
                      style={{ width: `${(gpuUsage.usedMinutes / gpuUsage.quotaMinutes) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {gpuStats ? gpuStats.activeUsers : 'Loading...'}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {gpuStats ? `${gpuStats.totalSessions} total sessions` : ''}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* GPU Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">GPU Status</dt>
                  <dd className="text-lg font-medium text-gray-900">Operational</dd>
                  <dd className="text-sm text-gray-500">
                    {gpuStats ? `${gpuStats.gpus.length} GPUs available` : ''}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Editor */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Python Code Editor</h2>
            </div>
            <div className="p-6">
              <Editor
                height="400px"
                defaultLanguage="python"
                value={code}
                onChange={(value: string | undefined) => setCode(value || '')}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={runCode}
                disabled={isRunning || !gpuUsage?.remainingMinutes}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              <button
                onClick={clearOutput}
                className="btn-outline"
              >
                Clear Output
              </button>
            </div>
            {gpuUsage && gpuUsage.remainingMinutes === 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  Daily GPU quota exceeded. Please try again tomorrow.
                </p>
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Output</h2>
            </div>
            <div className="p-6">
              <div 
                className={`bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm h-96 overflow-auto ${
                  showInputPrompt ? 'cursor-text' : ''
                }`}
                onClick={() => showInputPrompt && document.getElementById('terminal-input')?.focus()}
              >
                <pre className="whitespace-pre-wrap">{output || 'Output will appear here when you run your code...'}</pre>
                
                {/* Inline Input in Terminal */}
                {showInputPrompt && (
                  <div className="flex items-center">
                    <span className="text-green-400">{currentInputPrompt}</span>
                    <input
                      id="terminal-input"
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          submitUserInput();
                        }
                      }}
                      className="flex-1 bg-transparent text-gray-100 outline-none border-none ml-2"
                      placeholder="Type your input here..."
                      autoFocus
                      style={{
                        caretColor: '#10b981',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                      }}
                    />
                    <span className="text-gray-400 animate-pulse">█</span>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GPU Stats Panel */}
        {gpuStats && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">GPU Performance Stats</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gpuStats.gpus.map((gpu) => (
                  <div key={gpu.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">{gpu.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Temperature:</span>
                        <span className="text-sm font-medium">{gpu.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Utilization:</span>
                        <span className="text-sm font-medium">{gpu.utilization}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Memory:</span>
                        <span className="text-sm font-medium">{gpu.memoryUsed}/{gpu.memoryTotal} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Power Usage:</span>
                        <span className="text-sm font-medium">{gpu.powerUsage}W</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className="text-sm font-medium text-green-600">{gpu.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
