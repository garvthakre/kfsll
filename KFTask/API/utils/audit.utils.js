const db = require('../config/db');

/**
 * Log user actions for audit trail
 * @param {Number} userId - ID of the user performing the action
 * @param {String} action - Short description of the action performed
 * @param {String} description - Detailed description of the action
 * @param {String} ipAddress - IP address of the user (optional)
 * @returns {Promise<Object>} - The created log entry
 */
exports.logUserAction = async (userId, action, description, ipAddress = null) => {
  try {
    const result = await db.query(
      `INSERT INTO user_logs (
        user_id, 
        action, 
        description, 
        ip_address
      ) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *`,
      [
        userId,
        action,
        description,
        ipAddress
      ]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error logging user action:', error);
    // Don't throw the error to prevent it from affecting the main functionality
    return null;
  }
};

/**
 * Get recent user actions for a specific user
 * @param {Number} userId - ID of the user
 * @param {Number} limit - Maximum number of actions to return (default: 10)
 * @returns {Promise<Array>} - Array of recent user actions
 */
exports.getUserRecentActions = async (userId, limit = 10) => {
  try {
    const result = await db.query(
      `SELECT * 
       FROM user_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting user recent actions:', error);
    return [];
  }
};