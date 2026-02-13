const GPUServiceInterface = require('./gpuServiceInterface');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Mock GPU Service Implementation
 * Simulates GPU execution for demo purposes.
 * Can be replaced with real GPU implementation later.
 */
class MockGPUService extends GPUServiceInterface {
  constructor(db) {
    super();
    this.db = db;
    this.activeSessions = new Map(); // userId -> session data
    this.pendingInputs = new Map(); // Store sessions waiting for input
    this.DAILY_QUOTA_MINUTES = parseInt(process.env.DAILY_GPU_QUOTA_MINUTES) || 60;
  }

  async startExecution(userId, sessionId) {
    console.log(`Starting GPU execution for user ${userId}, session ${sessionId}`);
    
    // Check quota availability
    const hasQuota = await this.hasQuotaAvailable(userId);
    if (!hasQuota) {
      throw new Error('Daily GPU quota exceeded');
    }

    // Record session start
    const sessionData = {
      userId,
      sessionId,
      startTime: new Date(),
      status: 'running'
    };

    this.activeSessions.set(userId, sessionData);

    // Insert into database
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO gpu_usage (user_id, session_id, start_time) VALUES (?, ?, ?)',
        [userId, sessionId, sessionData.startTime.toISOString()],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              success: true,
              sessionId,
              startTime: sessionData.startTime,
              message: 'GPU execution started'
            });
          }
        }
      );
    });
  }

  async stopExecution(userId, sessionId) {
    console.log(`Stopping GPU execution for user ${userId}, session ${sessionId}`);
    
    const sessionData = this.activeSessions.get(userId);
    if (!sessionData) {
      throw new Error('No active session found for user');
    }

    const endTime = new Date();
    const durationMinutes = Math.ceil((endTime - sessionData.startTime) / (1000 * 60));

    // Update database record
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE gpu_usage SET end_time = ?, duration_minutes = ? WHERE user_id = ? AND session_id = ?',
        [endTime.toISOString(), durationMinutes, userId, sessionId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            // Update daily quota
            this.updateDailyQuota(userId, durationMinutes);
            
            // Remove from active sessions
            this.activeSessions.delete(userId);
            
            resolve({
              success: true,
              sessionId,
              endTime,
              durationMinutes,
              message: 'GPU execution stopped'
            });
          }
        }.bind(this)
      );
    });
  }

  async getUsage(userId, date = null) {
    const queryDate = date || new Date().toISOString().split('T')[0];
    
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT used_minutes FROM daily_quota WHERE user_id = ? AND date = ?',
        [userId, queryDate],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              userId,
              date: queryDate,
              usedMinutes: row ? row.used_minutes : 0,
              quotaMinutes: this.DAILY_QUOTA_MINUTES,
              remainingMinutes: Math.max(0, this.DAILY_QUOTA_MINUTES - (row ? row.used_minutes : 0))
            });
          }
        }
      );
    });
  }

  async getGPUStats() {
    // Simulate GPU stats like nvidia-smi output
    const simulatedStats = {
      timestamp: new Date().toISOString(),
      gpus: [
        {
          id: 0,
          name: 'NVIDIA RTX 4090',
          temperature: Math.floor(Math.random() * 20) + 65, // 65-85°C
          utilization: Math.floor(Math.random() * 30) + 40, // 40-70%
          memoryUsed: Math.floor(Math.random() * 8) + 12, // 12-20GB
          memoryTotal: 24,
          powerUsage: Math.floor(Math.random() * 100) + 250, // 250-350W
          status: 'Active'
        },
        {
          id: 1,
          name: 'NVIDIA RTX 4090',
          temperature: Math.floor(Math.random() * 20) + 60, // 60-80°C
          utilization: Math.floor(Math.random() * 25) + 35, // 35-60%
          memoryUsed: Math.floor(Math.random() * 6) + 8, // 8-14GB
          memoryTotal: 24,
          powerUsage: Math.floor(Math.random() * 80) + 200, // 200-280W
          status: 'Active'
        }
      ],
      totalMemory: 48,
      usedMemory: Math.floor(Math.random() * 20) + 20, // 20-40GB
      activeUsers: this.activeSessions.size,
      totalSessions: Math.floor(Math.random() * 5) + 2
    };

    return simulatedStats;
  }

  async hasQuotaAvailable(userId) {
    const usage = await this.getUsage(userId);
    return usage.remainingMinutes > 0;
  }

  async executeCode(userId, sessionId, code) {
    console.log('Executing code for user:', userId, 'session:', sessionId);
    console.log('Code to execute:', code);
    
    // Check quota first
    const hasQuota = await this.hasQuotaAvailable(userId);
    if (!hasQuota) {
      throw new Error('Daily GPU quota exceeded. Please try again tomorrow.');
    }

    return new Promise((resolve, reject) => {
      // Create temporary file for code execution
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, `temp_${sessionId}_${Date.now()}.py`);
      
      // Prepend ML template to user code
      const templatePath = path.join(__dirname, 'ml_template.py');
      let templateCode = '';
      try {
        templateCode = fs.readFileSync(templatePath, 'utf8') + '\n\n';
      } catch (err) {
        console.error('Error reading ML template:', err);
      }
      
      // Process user code for pip install commands
      let processedCode = code;
      let pipCommands = [];
      
      // Extract pip install commands (both !pip and pip)
      const pipRegex = /(!\s*)?pip\s+install\s+(.+?)(?:\n|$)/g;
      let match;
      while ((match = pipRegex.exec(code)) !== null) {
        const fullCommand = match[0].trim();
        const packageSpec = match[2].trim();
        pipCommands.push(`pip install ${packageSpec}`);
        // Remove pip command from user code, preserving line structure
        processedCode = processedCode.replace(fullCommand, '');
      }
      
      // Clean up the processed code - remove extra newlines and fix indentation
      processedCode = processedCode
        .replace(/\n\s*\n\s*\n/g, '\n\n')  // Remove excessive newlines
        .replace(/^\s+|\s+$/g, '')         // Trim leading/trailing whitespace
        .replace(/\t/g, '    ');            // Convert tabs to spaces
      
      // Build the full execution code
      let fullCode = templateCode;
      
      // Add pip install commands first if any
      if (pipCommands.length > 0) {
        fullCode += '# Package Installation Commands\n';
        pipCommands.forEach(cmd => {
          fullCode += `import subprocess\n`;
          fullCode += `import sys\n`;
          fullCode += `try:\n`;
          fullCode += `    result = subprocess.run([sys.executable, '-m', 'pip', 'install', '${cmd.replace('pip install ', '')}'], capture_output=True, text=True)\n`;
          fullCode += `    if result.returncode == 0:\n`;
          fullCode += `        print(f"✅ Successfully installed: ${cmd.replace('pip install ', '')}")\n`;
          fullCode += `    else:\n`;
          fullCode += `        print(f"❌ Installation failed: {result.stderr}")\n`;
          fullCode += `except Exception as e:\n`;
          fullCode += `    print(f"❌ Error installing package: {e}")\n`;
          fullCode += `\n`;
        });
      }
      
      // Add user code with proper formatting
      if (processedCode.trim()) {
        fullCode += '\n# User Code\n' + processedCode + '\n';
      }
      
      // Add automatic figure rendering at the end (Colab-style)
      fullCode += '\n# Automatic figure rendering (Colab-style)\ntry:\n    render_existing_figures()\nexcept NameError:\n    pass\nexcept Exception as e:\n    print(f"Warning: Could not render figures: {e}")\n';
      
      fs.writeFileSync(tempFile, fullCode, 'utf8');

      console.log('Created temp file:', tempFile);

      const startTime = Date.now();
      
      // Execute Python code with ML libraries support
      const pythonProcess = spawn('python', [tempFile], {
        timeout: 300000, // 5 minutes timeout
        cwd: tempDir,
        env: {
          ...process.env,
          // Use Agg backend for reliable figure rendering
          MPLBACKEND: 'Agg',
          PYTHONIOENCODING: 'utf-8', // Force UTF-8 encoding for Python I/O
          LC_ALL: 'en_US.UTF-8', // Set locale to UTF-8
          LANG: 'en_US.UTF-8', // Set language to UTF-8
          // Matplotlib config directory
          MPLCONFIGDIR: tempDir
        }
      });

      console.log('Started Python process with PID:', pythonProcess.pid);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        console.log('Python process closed with code:', code);
        console.log('stdout:', stdout);
        console.log('stderr:', stderr);
        
        const executionTime = Date.now() - startTime;
        const durationMinutes = Math.ceil(executionTime / (1000 * 60));

        try {
          // Clean up temp file
          fs.unlinkSync(tempFile);
        } catch (err) {
          console.error('Error cleaning up temp file:', err);
        }

        // Process output for ML-specific content
        let processedOutput = stdout || stderr;
        let outputType = 'text';

        // Check for plot files (robust execution environment)
        const plotFiles = fs.readdirSync(tempDir).filter(file => 
          (file.endsWith('.png') || file.endsWith('.svg')) && 
          (file.startsWith('plot_') || file.startsWith('figure_'))
        );

        if (plotFiles.length > 0) {
          // Convert plots to base64 for embedding
          const plotData = plotFiles.map(plotFile => {
            const plotPath = path.join(tempDir, plotFile);
            const plotBuffer = fs.readFileSync(plotPath);
            const base64Plot = plotBuffer.toString('base64');
            const mimeType = plotFile.endsWith('.png') ? 'image/png' : 'image/svg+xml';
            
            // Clean up plot file
            fs.unlinkSync(plotPath);
            
            return `data:${mimeType};base64,${base64Plot}`;
          });

          if (plotData.length > 0) {
            processedOutput = plotData.map((data, index) => 
              `<img src="${data}" alt="Plot ${index + 1}" style="max-width: 100%; height: auto;">`
            ).join('\n');
            outputType = 'html';
          }
        }

        // Check for DataFrame outputs and format them nicely
        if (processedOutput.includes('DataFrame') || processedOutput.includes('shape:')) {
          outputType = 'dataframe';
        }

        // Record usage
        await this.updateDailyQuota(userId, durationMinutes);

        // Store execution session
        this.db.run(
          'INSERT INTO execution_sessions (user_id, session_id, code, output, execution_time, status) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, sessionId, code, processedOutput, executionTime, code === 0 ? 'success' : 'error']
        );

        console.log('Resolving with result:', {
          success: code === 0,
          output: processedOutput,
          executionTime,
          durationMinutes,
          exitCode: code,
          error: code !== 0 ? stderr : null
        });

        resolve({
          success: code === 0,
          output: processedOutput,
          executionTime,
          durationMinutes,
          exitCode: code,
          error: code !== 0 ? stderr : null
        });
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });
    });
  }

  async updateDailyQuota(userId, additionalMinutes) {
    const today = new Date().toISOString().split('T')[0];
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO daily_quota (user_id, date, used_minutes) 
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, date) 
         DO UPDATE SET used_minutes = used_minutes + ?, updated_at = CURRENT_TIMESTAMP`,
        [userId, today, additionalMinutes, additionalMinutes],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async handleUserInput(userId, sessionId, input) {
    // Check if session is waiting for input
    const sessionData = this.pendingInputs.get(sessionId);
    if (!sessionData) {
      throw new Error('No active session waiting for input');
    }

    // Resume execution with user input
    return new Promise((resolve, reject) => {
      // Create a modified version of the code that includes the user input
      const modifiedCode = sessionData.originalCode.replace(
        /input\((["'])(.*?)\1\)/g,
        (match, quote, prompt) => {
          // For demo purposes, we'll simulate the input
          return `"${input}"`;
        }
      );

      // Execute the modified code
      this.executeCode(userId, sessionId, modifiedCode)
        .then(result => {
          // Clear the pending input
          this.pendingInputs.delete(sessionId);
          resolve(result);
        })
        .catch(reject);
    });
  }

  async executeCodeWithInputSupport(userId, sessionId, code) {
    console.log('Checking for input() in code:', code);
    
    // Check if code contains input() function calls
    const inputRegex = /input\s*\(\s*(['"])(.*?)\1\s*\)/g;
    const inputMatches = [...code.matchAll(inputRegex)];
    
    console.log('Found input matches:', inputMatches);
    
    if (inputMatches.length > 0) {
      // This code requires user input
      const firstInputMatch = inputMatches[0];
      const prompt = firstInputMatch[2] || 'Enter input: ';
      
      console.log('First input prompt:', prompt);
      
      // Store session data for later input handling
      this.pendingInputs.set(sessionId, {
        userId,
        originalCode: code,
        currentInputIndex: 0,
        totalInputs: inputMatches.length,
        inputMatches: inputMatches
      });

      console.log('Session data stored for:', sessionId);

      // Return partial result indicating input is needed
      return {
        success: true,
        output: '',
        executionTime: 0,
        durationMinutes: 0,
        exitCode: 0,
        requiresInput: true,
        inputPrompt: prompt
      };
    }

    // No input required, execute normally
    console.log('No input found, executing normally');
    return this.executeCode(userId, sessionId, code);
  }

  async handleUserInput(userId, sessionId, input) {
    console.log('Handling user input:', input, 'for session:', sessionId);
    
    // Check if session is waiting for input
    const sessionData = this.pendingInputs.get(sessionId);
    if (!sessionData) {
      console.log('No session data found for:', sessionId);
      throw new Error('No active session waiting for input');
    }

    console.log('Session data found:', sessionData);

    try {
      // Replace the next input() call with the provided input
      let { originalCode, currentInputIndex, inputMatches } = sessionData;
      
      const nextInputMatch = inputMatches[currentInputIndex];
      
      console.log('Replacing input pattern:', nextInputMatch[0], 'with:', input);
      
      // Replace the specific input() call with the user's input
      const inputPattern = nextInputMatch[0];
      const replacement = JSON.stringify(input); // Properly escape the input string
      
      // Use a more precise replacement - only replace the first occurrence
      let modifiedCode = originalCode;
      const index = modifiedCode.indexOf(inputPattern);
      if (index !== -1) {
        modifiedCode = modifiedCode.substring(0, index) + 
                      replacement + 
                      modifiedCode.substring(index + inputPattern.length);
      }

      console.log('Modified code:', modifiedCode);

      // Update session data
      sessionData.currentInputIndex++;
      sessionData.originalCode = modifiedCode; // Update the original code for next replacement

      if (currentInputIndex < inputMatches.length - 1) {
        // More inputs needed
        const nextPrompt = inputMatches[currentInputIndex + 1][2] || 'Enter input: ';
        
        console.log('More inputs needed, next prompt:', nextPrompt);
        
        return {
          success: true,
          output: '', // We'll show the input in the frontend
          executionTime: 0,
          durationMinutes: 0,
          exitCode: 0,
          requiresInput: true,
          inputPrompt: nextPrompt
        };
      } else {
        // All inputs provided, execute the final code
        console.log('All inputs provided, executing final code');
        const result = await this.executeCode(userId, sessionId, modifiedCode);
        
        // Clear the pending input
        this.pendingInputs.delete(sessionId);
        
        return result;
      }
    } catch (error) {
      console.error('Error handling user input:', error);
      // Clear the pending input on error
      this.pendingInputs.delete(sessionId);
      throw error;
    }
  }

  async getAllUserUsage() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT u.id, u.email, u.role, COALESCE(dq.used_minutes, 0) as used_minutes,
         COALESCE(dq.date, ?) as date
         FROM users u
         LEFT JOIN daily_quota dq ON u.id = dq.user_id AND dq.date = ?
         WHERE u.enabled = 1
         ORDER BY used_minutes DESC`,
        [new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => ({
              ...row,
              quotaMinutes: this.DAILY_QUOTA_MINUTES,
              remainingMinutes: Math.max(0, this.DAILY_QUOTA_MINUTES - row.used_minutes)
            })));
          }
        }
      );
    });
  }
}

module.exports = MockGPUService;
