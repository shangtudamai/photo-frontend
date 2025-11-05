import request from '../utils/request';

/**
 * 仪表盘数据服务
 */

/**
 * 获取仪表盘统计数据
 */
export const getDashboardStats = () => {
  return request.get('/api/dashboard/stats');
};

/**
 * 获取最近订单列表
 * @param {number} limit - 数量限制
 */
export const getRecentOrders = (limit = 10) => {
  return request.get('/api/dashboard/recent-orders', {
    params: { limit }
  });
};

/**
 * 获取员工工作负载
 */
export const getEmployeeWorkloads = () => {
  return request.get('/api/dashboard/employee-workloads');
};

/**
 * 获取财务概览数据
 * @param {number} days - 天数
 */
export const getFinancialSummary = (days = 7) => {
  return request.get('/api/dashboard/financial-summary', {
    params: { days }
  });
};

/**
 * 获取甘特图数据
 */
export const getGanttData = () => {
  return request.get('/api/dashboard/gantt-data');
};

/**
 * 获取今日订单统计
 */
export const getTodayOrderStats = () => {
  return request.get('/api/dashboard/today-orders');
};

/**
 * 获取今日营收统计
 */
export const getTodayRevenue = () => {
  return request.get('/api/dashboard/today-revenue');
};

/**
 * 获取逾期未收款统计
 */
export const getOverduePayments = () => {
  return request.get('/api/dashboard/overdue-payments');
};

/**
 * 获取待处理任务数
 */
export const getPendingTasks = () => {
  return request.get('/api/dashboard/pending-tasks');
};
