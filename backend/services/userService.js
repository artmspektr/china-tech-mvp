const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class UserService {
  // Получение пользователя по ID
  static async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      return user;
    } catch (error) {
      throw new Error(`Error retrieving user: ${error.message}`);
    }
  }

  // Получение пользователя по email
  static async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email }).select('-password');
      return user;
    } catch (error) {
      throw new Error(`Error retrieving user: ${error.message}`);
    }
  }

  // Создание нового пользователя
  static async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Обновление пользователя
  static async updateUser(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');
      
      return user;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Деактивация пользователя
  static async deactivateUser(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      ).select('-password');
      
      return user;
    } catch (error) {
      throw new Error(`Error deactivating user: ${error.message}`);
    }
  }

  // Получение списка пользователей с пагинацией
  static async getUsers(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      
      const users = await User.find(filters)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
        
      const total = await User.countDocuments(filters);
      
      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Обновление профиля пользователя
  static async updateProfile(userId, profileData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { profile: { ...profileData } } },
        { new: true }
      ).select('-password');
      
      return user;
    } catch (error) {
      throw new Error(`Error updating profile: ${error.message}`);
    }
  }

  // Смена роли пользователя
  static async changeUserRole(userId, newRole) {
    try {
      const validRoles = ['user', 'admin', 'moderator'];
      
      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role');
      }
      
      const user = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true }
      ).select('-password');
      
      return user;
    } catch (error) {
      throw new Error(`Error changing user role: ${error.message}`);
    }
  }
}

module.exports = UserService;