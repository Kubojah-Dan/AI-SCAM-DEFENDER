/**
 * GPU Service Interface - Abstract Layer
 * This defines the contract for GPU operations.
 * Real GPU implementation can replace the mock implementation
 * without changing any other code.
 */
class GPUServiceInterface {
  /**
   * Start GPU execution for a user
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Execution result
   */
  async startExecution(userId, sessionId) {
    throw new Error('startExecution method must be implemented');
  }

  /**
   * Stop GPU execution for a user
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Stop result
   */
  async stopExecution(userId, sessionId) {
    throw new Error('stopExecution method must be implemented');
  }

  /**
   * Get GPU usage for a user
   * @param {string} userId - User ID
   * @param {string} date - Date (YYYY-MM-DD format)
   * @returns {Promise<Object>} Usage data
   */
  async getUsage(userId, date) {
    throw new Error('getUsage method must be implemented');
  }

  /**
   * Get GPU statistics
   * @returns {Promise<Object>} GPU stats
   */
  async getGPUStats() {
    throw new Error('getGPUStats method must be implemented');
  }

  /**
   * Check if user has available quota
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Has quota available
   */
  async hasQuotaAvailable(userId) {
    throw new Error('hasQuotaAvailable method must be implemented');
  }

  /**
   * Execute Python code
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {string} code - Python code to execute
   * @returns {Promise<Object>} Execution result
   */
  async executeCode(userId, sessionId, code) {
    throw new Error('executeCode method must be implemented');
  }
}

module.exports = GPUServiceInterface;
