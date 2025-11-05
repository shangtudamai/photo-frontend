import request from '../utils/request';

/**
 * 用户管理相关 API 服务
 */

// 获取用户列表
export const getUserList = (params) => {
  return request.get('/api/users', { params });
};

// 获取用户详情
export const getUserDetail = (userId) => {
  return request.get(`/api/users/${userId}`);
};

// 创建用户
export const createUser = (data) => {
  return request.post('/api/users', data);
};

// 更新用户
export const updateUser = (userId, data) => {
  return request.put(`/api/users/${userId}`, data);
};

// 删除用户
export const deleteUser = (userId) => {
  return request.delete(`/api/users/${userId}`);
};

// 检查用户名是否存在
export const checkUsernameExists = (username) => {
  return request.get('/api/users/check-username', {
    params: { username }
  });
};

// 重置用户密码
export const resetUserPassword = (userId) => {
  return request.post(`/api/users/${userId}/reset-password`);
};

// 启用/禁用用户
export const toggleUserStatus = (userId, status) => {
  return request.put(`/api/users/${userId}/status`, { status });
};

// 批量删除用户
export const batchDeleteUsers = (userIds) => {
  return request.post('/api/users/batch-delete', { userIds });
};

// 获取角色列表
export const getRoleList = () => {
  return request.get('/api/roles');
};

// 获取用户操作日志
export const getUserOperationLogs = (params) => {
  return request.get('/api/users/operation-logs', { params });
};

// 生成随机密码（客户端辅助函数）
export const generateRandomPassword = (length = 8) => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';

  // 确保至少包含一个大写字母、一个小写字母、一个数字
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%&*';

  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // 填充剩余字符
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // 打乱密码顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export default {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  checkUsernameExists,
  resetUserPassword,
  toggleUserStatus,
  batchDeleteUsers,
  getRoleList,
  getUserOperationLogs,
  generateRandomPassword
};
