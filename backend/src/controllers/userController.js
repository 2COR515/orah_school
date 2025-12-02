// userController.js - Controller for admin user management operations
const db = require('../../db');

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await db.getAllUsers();
    
    // Remove passwords before sending
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return res.status(200).json({
      ok: true,
      users: sanitizedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Delete a user (admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'User ID is required'
      });
    }
    
    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(403).json({
        ok: false,
        error: 'Cannot delete your own account'
      });
    }
    
    const deleted = await db.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    return res.status(200).json({
      ok: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update user role (admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({
        ok: false,
        error: 'User ID and role are required'
      });
    }
    
    // Validate role
    const validRoles = ['student', 'instructor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid role. Must be student, instructor, or admin'
      });
    }
    
    // Prevent admin from changing their own role
    if (req.user.id === userId) {
      return res.status(403).json({
        ok: false,
        error: 'Cannot change your own role'
      });
    }
    
    const updated = await db.updateUserRole(userId, role);
    
    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    return res.status(200).json({
      ok: true,
      message: 'User role updated successfully',
      user: updated
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  updateUserRole
};
