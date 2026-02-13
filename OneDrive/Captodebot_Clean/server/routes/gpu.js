const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Start GPU execution session
router.post('/execute/start', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.userId;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const gpuService = req.app.locals.gpuService;
    const result = await gpuService.startExecution(userId, sessionId);
    
    res.json(result);
  } catch (error) {
    console.error('Start execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop GPU execution session
router.post('/execute/stop', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.userId;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const gpuService = req.app.locals.gpuService;
    const result = await gpuService.stopExecution(userId, sessionId);
    
    res.json(result);
  } catch (error) {
    console.error('Stop execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute Python code
router.post('/execute/code', authenticateToken, async (req, res) => {
  try {
    const { code, sessionId } = req.body;
    const userId = req.user.userId;
    
    if (!code || !sessionId) {
      return res.status(400).json({ error: 'Code and session ID are required' });
    }

    const gpuService = req.app.locals.gpuService;
    const result = await gpuService.executeCodeWithInputSupport(userId, sessionId, code);
    
    res.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle user input for interactive execution
router.post('/execute/input', authenticateToken, async (req, res) => {
  try {
    const { sessionId, input } = req.body;
    const userId = req.user.userId;
    
    if (!sessionId || input === undefined) {
      return res.status(400).json({ error: 'Session ID and input are required' });
    }

    const gpuService = req.app.locals.gpuService;
    const result = await gpuService.handleUserInput(userId, sessionId, input);
    
    res.json(result);
  } catch (error) {
    console.error('User input error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's GPU usage
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.userId;
    
    const gpuService = req.app.locals.gpuService;
    const usage = await gpuService.getUsage(userId, date);
    
    res.json(usage);
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get GPU statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const gpuService = req.app.locals.gpuService;
    const stats = await gpuService.getGPUStats();
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check quota availability
router.get('/quota/check', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const gpuService = req.app.locals.gpuService;
    const hasQuota = await gpuService.hasQuotaAvailable(userId);
    
    res.json({ hasQuota });
  } catch (error) {
    console.error('Check quota error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all users' usage
router.get('/admin/usage/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const gpuService = req.app.locals.gpuService;
    const allUsage = await gpuService.getAllUserUsage();
    
    res.json(allUsage);
  } catch (error) {
    console.error('Get all usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Reset user's daily quota
router.post('/admin/quota/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, date } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const resetDate = date || new Date().toISOString().split('T')[0];
    const db = req.app.locals.db;
    
    db.run(
      'UPDATE daily_quota SET used_minutes = 0 WHERE user_id = ? AND date = ?',
      [userId, resetDate],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({
          success: true,
          message: `Quota reset for user ${userId} on ${resetDate}`
        });
      }
    );
  } catch (error) {
    console.error('Reset quota error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Enable/disable user
router.put('/admin/user/:userId/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Enabled status must be boolean' });
    }

    const db = req.app.locals.db;
    
    db.run(
      'UPDATE users SET enabled = ? WHERE id = ?',
      [enabled, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
          success: true,
          message: `User ${enabled ? 'enabled' : 'disabled'} successfully`
        });
      }
    );
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
