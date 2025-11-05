/**
 * 系统参数配置页面
 * 仅管理员可见
 */

import React, { useState, useEffect } from 'react';
import { Card, Tabs, message, Result, Button } from 'antd';
import { useSelector } from 'react-redux';
import { SettingOutlined, HistoryOutlined } from '@ant-design/icons';
import CapacitySettings from './CapacitySettings';
import FinanceSettings from './FinanceSettings';
import RewardSettings from './RewardSettings';
import WorkTimeSettings from './WorkTimeSettings';
import ChangeLogModal from './ChangeLogModal';
import { getAllParameters } from '@/services/settingService';
import './SystemSettings.less';

const { TabPane } = Tabs;

function SystemSettings() {
  // Redux state
  const currentUser = useSelector((state) => state.user?.currentUser);

  // 本地 state
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState({
    capacity: [],
    finance: [],
    reward: [],
    worktime: []
  });
  const [activeTab, setActiveTab] = useState('capacity');
  const [changeLogVisible, setChangeLogVisible] = useState(false);

  // 权限检查
  const hasAdminPermission = () => {
    return currentUser?.roles?.includes('admin');
  };

  // 加载参数
  const loadParameters = async () => {
    setLoading(true);
    try {
      const res = await getAllParameters();
      if (res.code === 200) {
        setParameters(res.data);
      } else {
        message.error(res.message || '加载参数失败');
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
      message.error('加载参数失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAdminPermission()) {
      loadParameters();
    }
  }, []);

  // 参数更新成功后的回调
  const handleUpdateSuccess = () => {
    message.success('参数更新成功');
    loadParameters(); // 重新加载参数
  };

  // 如果不是管理员，显示 403 页面
  if (!hasAdminPermission()) {
    return (
      <div className="system-settings-container">
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面。仅管理员可以配置系统参数。"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="system-settings-container">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <SettingOutlined className="header-icon" />
          <div>
            <h2>系统参数配置</h2>
            <p>配置系统核心参数，参数变更后实时生效</p>
          </div>
        </div>
        <div className="header-right">
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setChangeLogVisible(true)}
          >
            查看变更日志
          </Button>
        </div>
      </div>

      {/* 参数配置卡片 */}
      <Card className="settings-card" loading={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 产能参数 */}
          <TabPane tab="产能参数" key="capacity">
            <CapacitySettings
              parameters={parameters.capacity}
              onUpdateSuccess={handleUpdateSuccess}
            />
          </TabPane>

          {/* 财务参数 */}
          <TabPane tab="财务参数" key="finance">
            <FinanceSettings
              parameters={parameters.finance}
              onUpdateSuccess={handleUpdateSuccess}
            />
          </TabPane>

          {/* 奖罚参数 */}
          <TabPane tab="奖罚参数" key="reward">
            <RewardSettings
              parameters={parameters.reward}
              onUpdateSuccess={handleUpdateSuccess}
            />
          </TabPane>

          {/* 工作时间参数 */}
          <TabPane tab="工作时间参数" key="worktime">
            <WorkTimeSettings
              parameters={parameters.worktime}
              onUpdateSuccess={handleUpdateSuccess}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 变更日志弹窗 */}
      <ChangeLogModal
        visible={changeLogVisible}
        onClose={() => setChangeLogVisible(false)}
      />
    </div>
  );
}

export default SystemSettings;
