// const jwt = require('jsonwebtoken');
import jwt from 'jsonwebtoken';
/**
 * Authentication middleware to protect routes
 * Verifies JWT token from Authorization header
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
 export const  authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required roles to access a resource
 * 
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to access this resource' 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorize
};