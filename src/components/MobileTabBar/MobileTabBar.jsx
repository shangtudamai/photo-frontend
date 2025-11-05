/**
 * 移动端底部导航栏
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useDeviceType } from '@/utils/responsive';
import './MobileTabBar.less';

function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const deviceType = useDeviceType();

  // 仅在移动端显示
  if (deviceType !== 'mobile') {
    return null;
  }

  // 导航项配置
  const tabs = [
    {
      key: 'dashboard',
      title: '首页',
      icon: <HomeOutlined />,
      path: '/dashboard'
    },
    {
      key: 'tasks',
      title: '任务',
      icon: <CheckSquareOutlined />,
      path: '/tasks'
    },
    {
      key: 'orders',
      title: '订单',
      icon: <FileTextOutlined />,
      path: '/orders'
    },
    {
      key: 'profile',
      title: '我的',
      icon: <UserOutlined />,
      path: '/profile'
    }
  ];

  // 判断当前激活的tab
  const getActiveKey = () => {
    const path = location.pathname;
    const activeTab = tabs.find(tab => path.startsWith(tab.path));
    return activeTab ? activeTab.key : '';
  };

  const activeKey = getActiveKey();

  return (
    <div className="mobile-tab-bar">
      {tabs.map(tab => (
        <div
          key={tab.key}
          className={`tab-item ${activeKey === tab.key ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <div className="tab-icon">
            {tab.icon}
          </div>
          <div className="tab-title">
            {tab.title}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MobileTabBar;
