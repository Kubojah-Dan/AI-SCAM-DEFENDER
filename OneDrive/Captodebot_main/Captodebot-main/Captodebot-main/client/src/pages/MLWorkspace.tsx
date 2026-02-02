import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface GPUUsage {
  usedMinutes: number;
  quotaMinutes: number;
  remainingMinutes: number;
}

interface Cell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output: CellOutput;
  isRunning: boolean;
}

interface CellOutput {
  type: 'text' | 'error' | 'plot' | 'dataframe' | 'html';
  content: string;
  data?: any;
}

interface Dataset {
  id: string;
  name: string;
  columns: string[];
  shape: [number, number];
  preview: any[];
}

const MLWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [cells, setCells] = useState<Cell[]>([
    {
      id: uuidv4(),
      type: 'code',
      content: `# ML Workspace - Server-based Python Environment

# Test basic Python functionality
print("Hello, ML Workspace!")

# Test data creation
import numpy as np
data = np.random.randn(100, 2)
print(f"Created data array with shape: {data.shape}")

# Create sample DataFrame
import pandas as pd
df_data = {'X': data[:, 0], 'Y': data[:, 1], 'Category': np.random.choice(['A', 'B', 'C'], 100)}
df = pd.DataFrame(df_data)
print("\\nSample DataFrame:")
print(df.head())
print(f"DataFrame shape: {df.shape}")

# Create visualization - image will appear automatically
import matplotlib.pyplot as plt
plt.figure(figsize=(10, 6))
plt.scatter(df['X'], df['Y'], alpha=0.6, c=pd.Categorical(df['Category']).codes, cmap='viridis')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.colorbar(label='Category')

print("\\n✅ Visualization created - image appears above")`,
      output: { type: 'text', content: '' },
      isRunning: false
    }
  ]);
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [gpuUsage, setGpuUsage] = useState<GPUUsage | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGPUUsage();
  }, []);

  const fetchGPUUsage = async () => {
    try {
      const response = await axios.get('/api/gpu/usage');
      setGpuUsage(response.data);
    } catch (err) {
      console.error('Error fetching GPU usage:', err);
    }
  };

  const addCell = (type: 'code' | 'markdown' = 'code') => {
    const newCell: Cell = {
      id: uuidv4(),
      type,
      content: type === 'code' ? '# Type your Python code here' : '# Type your markdown here',
      output: { type: 'text', content: '' },
      isRunning: false
    };
    setCells([...cells, newCell]);
    setSelectedCellId(newCell.id);
  };

  const updateCell = (cellId: string, updates: Partial<Cell>) => {
    setCells(cells.map(cell => 
      cell.id === cellId ? { ...cell, ...updates } : cell
    ));
  };

  const deleteCell = (cellId: string) => {
    setCells(cells.filter(cell => cell.id !== cellId));
    if (selectedCellId === cellId) {
      setSelectedCellId(null);
    }
  };

  const runCell = async (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell || cell.type !== 'code') return;

    updateCell(cellId, { isRunning: true, output: { type: 'text', content: 'Running...' } });

    try {
      const response = await axios.post('/api/gpu/execute/code', {
        code: cell.content,
        sessionId: uuidv4(),
        cellId
      });

      const result = response.data;
      let output: CellOutput = { type: 'text', content: '' };

      if (result.success) {
        if (result.output.includes('<img') || result.output.includes('<svg')) {
          output = { type: 'html', content: result.output };
        } else if (result.output.includes('DataFrame') || result.output.includes('shape:')) {
          output = { type: 'dataframe', content: result.output };
        } else {
          output = { type: 'text', content: result.output };
        }
      } else {
        output = { type: 'error', content: result.error || 'Execution failed' };
      }

      updateCell(cellId, { output, isRunning: false });
      await fetchGPUUsage();
    } catch (err: any) {
      updateCell(cellId, { 
        output: { type: 'error', content: err.response?.data?.error || 'Failed to execute code' }, 
        isRunning: false 
      });
    }
  };

  const runAllCells = async () => {
    const codeCells = cells.filter(cell => cell.type === 'code');
    for (const cell of codeCells) {
      await runCell(cell.id);
      // Small delay between cells to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const clearAllOutputs = () => {
    setCells(cells.map(cell => ({
      ...cell,
      output: { type: 'text', content: '' },
      isRunning: false
    })));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith('.csv')) {
      setUploadStatus('Please select a valid CSV file');
      return;
    }

    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/workspace/upload', formData);
      const dataset: Dataset = response.data;
      setDatasets([...datasets, dataset]);
      setUploadStatus(`Successfully uploaded ${dataset.name} (${dataset.shape[0]} rows, ${dataset.shape[1]} columns)`);
      
      // Add a new cell with the loaded dataset
      const newCell: Cell = {
        id: uuidv4(),
        type: 'code',
        content: `# Dataset: ${dataset.name}
import pandas as pd

# Method 1: Use the safe_load_csv function (recommended)
df = safe_load_csv()

if df is not None:
    print("Dataset shape:", df.shape)
    print("\\nColumns:", list(df.columns))
    print("\\nFirst 5 rows:")
    print(df.head())
    
    # Quick data info
    print("\\nDataset Info:")
    print(df.info())
    
    # Basic statistics for numeric columns
    print("\\nBasic Statistics:")
    print(df.describe())
    
    # Check for missing values
    print("\\nMissing Values:")
    print(df.isnull().sum())

# Alternative methods:
# df = pd.read_csv('${dataset.name}')  # Smart loading with error messages
# df = pd.read_csv(uploaded_file_path)  # Use the predefined variable`,
        output: { type: 'text', content: '' },
        isRunning: false
      };
      setCells([...cells, newCell]);
      
      // Clear status after 3 seconds
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setUploadStatus(`Error: ${err.response?.data?.error || 'Failed to upload file'}`);
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  const saveNotebook = () => {
    const notebook = {
      cells: cells.map(({ id, type, content }) => ({ id, type, content })),
      datasets: datasets.map(({ id, name, columns, shape }) => ({ id, name, columns, shape })),
      metadata: {
        created: new Date().toISOString(),
        author: user?.email
      }
    };
    
    const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml-notebook-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportResults = () => {
    const outputs = cells
      .filter(cell => cell.output.content)
      .map(cell => `Cell ${cell.id}:\n${cell.output.content}\n`)
      .join('\n---\n');
    
    const blob = new Blob([outputs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml-results-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderCell = (cell: Cell) => (
    <div 
      key={cell.id}
      className={`border rounded-lg mb-4 transition-all ${
        selectedCellId === cell.id ? 'ring-2 ring-blue-500' : ''
      } ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
      onClick={() => setSelectedCellId(cell.id)}
    >
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${
            cell.type === 'code' ? 'text-blue-600' : 'text-green-600'
          }`}>
            {cell.type === 'code' ? '[ ]' : '[M]'}
          </span>
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {cell.type === 'code' ? 'Code' : 'Markdown'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {cell.type === 'code' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                runCell(cell.id);
              }}
              disabled={cell.isRunning || !gpuUsage?.remainingMinutes}
              className={`px-3 py-1 text-xs rounded ${
                cell.isRunning 
                  ? 'bg-gray-300 text-gray-600' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {cell.isRunning ? 'Running...' : 'Run'}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteCell(cell.id);
            }}
            className={`px-3 py-1 text-xs rounded ${
              darkMode ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {cell.type === 'code' ? (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Editor
              height="200px"
              defaultLanguage="python"
              value={cell.content}
              onChange={(value) => updateCell(cell.id, { content: value || '' })}
              theme={darkMode ? 'vs-dark' : 'vs-light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                renderLineHighlight: 'none',
                glyphMargin: false,
                folding: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3
              }}
            />
          </div>
        ) : (
          <textarea
            value={cell.content}
            onChange={(e) => updateCell(cell.id, { content: e.target.value })}
            className={`w-full h-24 p-2 rounded border resize-none font-mono text-sm ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-gray-50 border-gray-300 text-gray-800'
            }`}
            placeholder="Type markdown here..."
          />
        )}
        
        {cell.output.content && (
          <div className={`mt-4 p-4 rounded-lg ${
            cell.output.type === 'error' 
              ? 'bg-red-50 border border-red-200' 
              : darkMode 
                ? 'bg-gray-900 border border-gray-700' 
                : 'bg-gray-50 border border-gray-200'
          }`}>
            {cell.output.type === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: cell.output.content }} />
            ) : cell.output.type === 'dataframe' ? (
              <div className="font-mono text-sm whitespace-pre-wrap">{cell.output.content}</div>
            ) : (
              <pre className={`text-sm whitespace-pre-wrap ${
                cell.output.type === 'error' ? 'text-red-600' : 
                darkMode ? 'text-gray-300' : 'text-gray-800'
              }`}>{cell.output.content}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ML Workspace
              </h1>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Interactive Python environment for Machine Learning
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* GPU Usage */}
              {gpuUsage && (
                <div className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                }`}>
                  <div className="text-sm font-medium">
                    GPU: {gpuUsage.usedMinutes}/{gpuUsage.quotaMinutes} min
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${(gpuUsage.usedMinutes / gpuUsage.quotaMinutes) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Controls */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📁 Upload CSV
              </button>
              
              <button
                onClick={saveNotebook}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                💾 Save
              </button>
              
              <button
                onClick={exportResults}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                📤 Export
              </button>
            </div>
          </div>
        </div>

        {/* File Upload */}
        {showFileUpload && (
          <div className={`mb-6 p-4 rounded-lg border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Upload Dataset
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Choose CSV File
            </button>
            {uploadStatus && (
              <div className={`mt-3 p-2 rounded text-sm ${
                uploadStatus.includes('Error') 
                  ? 'bg-red-100 text-red-700' 
                  : uploadStatus.includes('Uploading')
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {uploadStatus}
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className={`mb-6 p-4 rounded-lg border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => addCell('code')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Code Cell
              </button>
              <button
                onClick={() => addCell('markdown')}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                + Markdown Cell
              </button>
              <button
                onClick={runAllCells}
                disabled={!gpuUsage?.remainingMinutes}
                className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm disabled:opacity-50"
              >
                ▶️ Run All
              </button>
              <button
                onClick={clearAllOutputs}
                className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                🗑️ Clear Outputs
              </button>
            </div>
            
            {/* Datasets */}
            {datasets.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Datasets:
                </span>
                {datasets.map(dataset => (
                  <span
                    key={dataset.id}
                    className={`px-2 py-1 text-xs rounded ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {dataset.name} ({dataset.shape[0]}×{dataset.shape[1]})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cells Area */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {cells.map(renderCell)}
              {cells.length === 0 && (
                <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
                  darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'
                }`}>
                  <p className="text-lg mb-2">No cells yet</p>
                  <p className="text-sm">Add a code or markdown cell to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Actions */}
            <div className={`mb-6 p-4 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  📊 Data Analysis
                </button>
                <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  🤖 Model Training
                </button>
                <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  📈 Visualization
                </button>
                <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  🔍 EDA Tools
                </button>
              </div>
            </div>

            {/* Datasets */}
            {datasets.length > 0 && (
              <div className={`mb-6 p-4 rounded-lg border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📁 Uploaded Datasets
                </h3>
                <div className="space-y-2">
                  {datasets.map(dataset => (
                    <div
                      key={dataset.id}
                      className={`p-3 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {dataset.name}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {dataset.shape[0]} rows × {dataset.shape[1]} columns
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                        {dataset.columns.slice(0, 3).join(', ')}
                        {dataset.columns.length > 3 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Libraries */}
            <div className={`mb-6 p-4 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Available Libraries
              </h3>
              <div className="space-y-1 text-sm">
                <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>✅ NumPy</div>
                <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>✅ Pandas</div>
                <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>✅ Matplotlib</div>
                <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>✅ Seaborn</div>
                <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>✅ Scikit-learn</div>
                <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>✅ Plotly</div>
              </div>
            </div>

            {/* Tips */}
            <div className={`p-4 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className={`text-lg font-medium mb-3 ${
                darkMode ? 'text-white' : 'text-blue-900'
              }`}>
                💡 Tips
              </h3>
              <ul className={`text-sm space-y-1 ${
                darkMode ? 'text-gray-300' : 'text-blue-800'
              }`}>
                <li>• Use Shift+Enter to run cells</li>
                <li>• Upload CSV files for analysis</li>
                <li>• Visualizations appear automatically</li>
                <li>• Save your work frequently</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLWorkspace;
