// Express route controller for accounts
const express = require('express')
const router = express.Router()
const accountService = require('../services/accountService')
const { authenticateToken } = require('../middlewares/authMiddleware')

/**
 * POST /api/accounts/register
 * Register a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, dateOfBirth } = req.body
    const result = await accountService.register({ email, username, password, dateOfBirth })
    res.status(201).json(result)
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message || 'Internal server error during registration.' })
  }
})

/**
 * POST /api/accounts/login
 * Log into an existing account
 */
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body
    const result = await accountService.login({ emailOrUsername, password })
    res.status(200).json(result)
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message || 'Internal server error during login.' })
  }
})

/**
 * GET /api/accounts/me
 * Retrieve the authenticated user's profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await accountService.getProfile(req.user.id)
    res.status(200).json({ user: profile })
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message || 'Could not retrieve profile.' })
  }
})

module.exports = router
