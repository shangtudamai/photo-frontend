import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Spin, message } from 'antd';
import { useSelector } from 'react-redux';
import StatisticsCards from './StatisticsCards';
import RecentOrders from './RecentOrders';
import EmployeeWorkload from './EmployeeWorkload';
import ProjectGantt from './ProjectGantt';
import FinancialChart from './FinancialChart';
import {
  getDashboardStats,
  getRecentOrders,
  getEmployeeWorkloads,
  getFinancialSummary,
  getGanttData
} from '../../services/dashboardService';
import './Dashboard.less';

/**
 * 仪表盘主组件
 */
const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [financialData, setFinancialData] = useState([]);
  const [ganttData, setGanttData] = useState([]);

  // 从Redux获取当前用户信息
  const currentUser = useSelector((state) => state.auth.user);

  // 判断是否有管理权限
  const hasAdminAccess = () => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('admin') || currentUser.roles.includes('client_manager');
  };

  // 获取仪表盘数据
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // 并行请求所有数据
      const [
        statsRes,
        ordersRes,
        workloadsRes,
        financialRes,
        ganttRes
      ] = await Promise.all([
        getDashboardStats(),
        getRecentOrders(10),
        getEmployeeWorkloads(),
        getFinancialSummary(7),
        getGanttData()
      ]);

      // 设置统计数据
      if (statsRes.code === 200) {
        setStats(statsRes.data);
      }

      // 设置最近订单
      if (ordersRes.code === 200) {
        setRecentOrders(ordersRes.data || []);
      }

      // 设置员工负载（根据权限过滤）
      if (workloadsRes.code === 200) {
        let workloadData = workloadsRes.data || [];

        // 如果不是管理员，只显示自己的数据
        if (!hasAdminAccess()) {
          workloadData = workloadData.filter(
            item => item.userId === currentUser.userId
          );
        }

        setWorkloads(workloadData);
      }

      // 设置财务数据（仅管理员可见）
      if (financialRes.code === 200 && hasAdminAccess()) {
        setFinancialData(financialRes.data || []);
      }

      // 设置甘特图数据
      if (ganttRes.code === 200) {
        let ganttItems = ganttRes.data || [];

        // 如果不是管理员，只显示与自己相关的订单
        if (!hasAdminAccess()) {
          ganttItems = ganttItems.filter(
            item => item.assignedUsers && item.assignedUsers.includes(currentUser.userId)
          );
        }

        setGanttData(ganttItems);
      }

    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      message.error('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 页面加载时获取数据
  useEffect(() => {
    fetchDashboardData();

    // 每5分钟刷新一次数据
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5分钟

    // 清理定时器
    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchDashboardData]);

  return (
    <div className="dashboard-container">
      <Spin spinning={loading && !stats} tip="加载中...">
        {/* 顶部统计卡片 */}
        <StatisticsCards stats={stats} loading={loading} />

        {/* 中间区域 */}
        <Row gutter={16} className="middle-section">
          {/* 左侧：最近订单 */}
          <Col xs={24} lg={14}>
            <RecentOrders
              orders={recentOrders}
              loading={loading}
            />
          </Col>

          {/* 右侧：员工产能负载 */}
          <Col xs={24} lg={10}>
            <EmployeeWorkload
              workloads={workloads}
              loading={loading}
            />
          </Col>
        </Row>

        {/* 底部区域 */}
        <Row gutter={16} className="bottom-section">
          {/* 项目全局进度甘特图 */}
          <Col xs={24}>
            <ProjectGantt
              data={ganttData}
              loading={loading}
            />
          </Col>
        </Row>

        {/* 财务概览图表（仅管理员可见） */}
        {hasAdminAccess() && (
          <Row gutter={16} className="financial-section">
            <Col xs={24}>
              <FinancialChart
                data={financialData}
                loading={loading}
              />
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default Dashboard;
