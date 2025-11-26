// authMiddleware.js - Middleware functions for JWT authentication and authorization
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config');

/**
 * Middleware to verify a JWT in the Authorization: Bearer header.
 * Attaches decoded user payload (id, role) to req.user.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function authenticateToken(req, res, next) {
  try {
    // 1. Get token from 'Authorization' header (Bearer TOKEN)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    // 2. Check for token presence (401 if missing)
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'Access token is required'
      });
    }

    // 3. Verify token (jsonwebtoken.verify) using JWT_SECRET
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      // 4. If verification fails, return 403 Forbidden
      if (err) {
        return res.status(403).json({
          ok: false,
          error: 'Invalid or expired token'
        });
      }

      // 5. If valid, set req.user = decoded payload and call next()
      req.user = decoded; // Contains { id, role, iat, exp }
      next();
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error during authentication'
    });
  }
}

/**
 * Middleware generator to authorize access based on user role.
 * @param {string} requiredRole - The role required to access the route
 * @returns {Function} Middleware function
 */
function authorizeRole(requiredRole) {
  // 1. Returns a middleware function (req, res, next)
  return (req, res, next) => {
    try {
      // 2. Checks if req.user (set by authenticateToken) exists and req.user.role matches requiredRole
      if (!req.user) {
        return res.status(401).json({
          ok: false,
          error: 'Authentication required'
        });
      }

      if (req.user.role !== requiredRole) {
        // 3. If unauthorized, return 403 Forbidden
        return res.status(403).json({
          ok: false,
          error: `Access denied. ${requiredRole} role required.`
        });
      }

      // 4. If authorized, call next()
      next();

    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        ok: false,
        error: 'Internal server error during authorization'
      });
    }
  };
}

module.exports = { authenticateToken, authorizeRole };
