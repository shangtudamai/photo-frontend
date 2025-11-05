import React, { useState, useEffect } from 'react';
import { Row, Col, Select, Button, Space, Tabs, Badge } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import './TaskFilter.less';

const { Option } = Select;

/**
 * 任务筛选器组件
 */
const TaskFilter = ({
  onFilterChange,
  onTabChange,
  onAssignTask,
  onRefresh,
  currentUser,
  taskStats
}) => {
  const [activeTab, setActiveTab] = useState('my');
  const [filters, setFilters] = useState({
    status: undefined,
    taskType: undefined
  });

  // 任务状态选项
  const statusOptions = [
    { label: '全部状态', value: undefined },
    { label: '未开始', value: 1 },
    { label: '进行中', value: 2 },
    { label: '已完成', value: 3 },
    { label: '已退回', value: 4 }
  ];

  // 任务类型选项
  const taskTypeOptions = [
    { label: '全部类型', value: undefined },
    { label: '拍摄', value: 'photography' },
    { label: '后期', value: 'retouching' }
  ];

  // 检查是否是管理员
  const isAdmin = () => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('admin') ||
           currentUser.roles.includes('client_manager');
  };

  // 处理标签切换
  const handleTabChange = (key) => {
    setActiveTab(key);
    onTabChange(key);
  };

  // 处理筛选条件变化
  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...filters,
      [field]: value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // 处理重置
  const handleReset = () => {
    setFilters({
      status: undefined,
      taskType: undefined
    });
    onFilterChange({
      status: undefined,
      taskType: undefined
    });
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'my',
      label: (
        <span>
          我的任务
          {taskStats?.myTasks > 0 && (
            <Badge
              count={taskStats.myTasks}
              style={{ marginLeft: 8 }}
              overflowCount={99}
            />
          )}
        </span>
      )
    }
  ];

  // 管理员可以看到所有任务标签
  if (isAdmin()) {
    tabItems.push({
      key: 'all',
      label: (
        <span>
          所有任务
          {taskStats?.allTasks > 0 && (
            <Badge
              count={taskStats.allTasks}
              style={{ marginLeft: 8 }}
              overflowCount={99}
            />
          )}
        </span>
      )
    });
  }

  return (
    <div className="task-filter">
      {/* 角色切换标签 */}
      <div className="task-tabs">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          tabBarExtraContent={
            isAdmin() && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAssignTask}
              >
                分配任务
              </Button>
            )
          }
        />
      </div>

      {/* 筛选器 */}
      <div className="filter-bar">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="任务状态"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
              allowClear
            >
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="任务类型"
              value={filters.taskType}
              onChange={(value) => handleFilterChange('taskType', value)}
              style={{ width: '100%' }}
              allowClear
            >
              {taskTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TaskFilter;
