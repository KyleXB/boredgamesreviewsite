// IAccountService - Application logic for accounts and authentication
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const accountRepository = require('../repositories/accountRepository')

const JWT_SECRET = process.env.JWT_SECRET || 'boredgames_default_secret_key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

const accountService = {
  /**
   * Helper: generate a signed JWT
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
  },

  /**
   * Register a new user
   */
  async register({ email, username, password, dateOfBirth = null }) {
    if (!email || !username || !password) {
      throw { status: 400, message: 'Email, username, and password are required.' }
    }

    // Basic format validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw { status: 400, message: 'Invalid email address format.' }
    }

    if (username.length < 3 || username.length > 30) {
      throw { status: 400, message: 'Username must be between 3 and 30 characters.' }
    }

    if (password.length < 6) {
      throw { status: 400, message: 'Password must be at least 6 characters long.' }
    }

    // Check uniqueness
    const existingEmail = await accountRepository.findByEmail(email)
    if (existingEmail) {
      throw { status: 409, message: 'An account with this email already exists.' }
    }

    const existingUsername = await accountRepository.findByUsername(username)
    if (existingUsername) {
      throw { status: 409, message: 'This username is already taken.' }
    }

    // Hash password with salt rounds = 10
    const passwordHash = await bcrypt.hash(password, 10)

    // Save to database
    const newUser = await accountRepository.create({
      email,
      username,
      passwordHash,
      dateOfBirth,
      role: 'USER'
    })

    const token = this.generateToken(newUser)

    return {
      user: newUser,
      token
    }
  },

  /**
   * Authenticate and log in an existing user
   */
  async login({ emailOrUsername, password }) {
    if (!emailOrUsername || !password) {
      throw { status: 400, message: 'Email/username and password are required.' }
    }

    // Look up by email first, then username
    let user = null
    if (emailOrUsername.includes('@')) {
      user = await accountRepository.findByEmail(emailOrUsername)
    } else {
      user = await accountRepository.findByUsername(emailOrUsername)
    }

    if (!user) {
      throw { status: 401, message: 'Invalid credentials.' }
    }

    // Check account ban status
    if (user.isBanned) {
      throw { status: 403, message: 'Your account has been banned. Please contact support.' }
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      throw { status: 401, message: 'Invalid credentials.' }
    }

    const token = this.generateToken(user)

    // Return sanitized user object (exclude passwordHash)
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt
    }

    return {
      user: sanitizedUser,
      token
    }
  },

  /**
   * Fetch current user profile by ID
   */
  async getProfile(userId) {
    const user = await accountRepository.findById(userId)
    if (!user) {
      throw { status: 404, message: 'User not found.' }
    }
    return user
  }
}

module.exports = accountService
