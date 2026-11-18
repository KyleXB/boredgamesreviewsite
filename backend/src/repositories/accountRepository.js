// IAccountRepository - Data access for user accounts
const prisma = require('../prismaClient')

const accountRepository = {
  // Find a user by their unique email
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
  },

  // Find a user by their unique username
  async findByUsername(username) {
    return await prisma.user.findUnique({
      where: { username }
    })
  },

  // Find a user by ID with optional selection or relations
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        dateOfBirth: true,
        role: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true
      }
    })
  },

  // Create a new user record
  async create({ email, username, passwordHash, dateOfBirth = null, role = 'USER' }) {
    return await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        passwordHash,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        role
      },
      select: {
        id: true,
        email: true,
        username: true,
        dateOfBirth: true,
        role: true,
        isBanned: true,
        createdAt: true
      }
    })
  },

  // Update user profile or ban status
  async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        dateOfBirth: true,
        role: true,
        isBanned: true,
        updatedAt: true
      }
    })
  }
}

module.exports = accountRepository
