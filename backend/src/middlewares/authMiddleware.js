// Authentication & authorization middlewares
const jwt = require('jsonwebtoken')
const accountRepository = require('../repositories/accountRepository')

const JWT_SECRET = process.env.JWT_SECRET || 'boredgames_default_secret_key'

/**
 * Middleware to authenticate JWT token from Authorization header (Bearer <token>)
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await accountRepository.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ error: 'User associated with this token no longer exists.' })
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned. Access denied.' })
    }

    // Attach user object to request
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

/**
 * Optional authentication: attaches user if valid token present, but doesn't block guests
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    return next()
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await accountRepository.findById(decoded.id)
    if (user && !user.isBanned) {
      req.user = user
    }
  } catch (err) {
    // Ignore invalid token for optional auth
  }

  next()
}

/**
 * Middleware to enforce role requirements (e.g. requireRole(['MODERATOR', 'ADMIN']))
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' })
    }

    next()
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole
}
