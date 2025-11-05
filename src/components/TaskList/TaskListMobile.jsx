/**
 * 任务列表移动端适配
 * 移动端卡片渲染函数
 */

import React from 'react';
import { Tag, Button, Progress, Space } from 'antd';
import { ClockCircleOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './TaskListMobile.less';

/**
 * 获取任务状态标签
 */
export const getTaskStatusTag = (status) => {
  const statusConfig = {
    1: { text: '未开始', color: 'default' },
    2: { text: '进行中', color: 'processing' },
    3: { text: '已完成', color: 'success' },
    4: { text: '已退回', color: 'error' }
  };

  const config = statusConfig[status] || statusConfig[1];

  return <Tag color={config.color}>{config.text}</Tag>;
};

/**
 * 获取任务类型文本
 */
export const getTaskTypeText = (type) => {
  const typeMap = {
    1: '摄影任务',
    2: '修图任务'
  };
  return typeMap[type] || '未知';
};

/**
 * 移动端任务卡片渲染
 */
export const renderMobileTaskCard = (task, onViewDetail, onUpdateProgress) => {
  // 计算截止日期的剩余天数
  const deadline = dayjs(task.deadline);
  const now = dayjs();
  const daysLeft = deadline.diff(now, 'day');

  // 判断是否即将逾期或已逾期
  const isUrgent = daysLeft <= 1 && daysLeft >= 0;
  const isOverdue = daysLeft < 0;

  return (
    <div className="mobile-task-card" key={task.taskId}>
      {/* 卡片头部 */}
      <div className="card-header">
        <div className="task-type">
          <Tag color="blue">{getTaskTypeText(task.taskType)}</Tag>
        </div>
        <div className="task-status">
          {getTaskStatusTag(task.taskStatus)}
        </div>
      </div>

      {/* 订单编号 */}
      <div className="task-order-no">
        <span className="label">订单编号:</span>
        <span className="value">{task.orderNo}</span>
      </div>

      {/* 任务信息 */}
      <div className="task-info">
        <div className="info-row">
          <span className="label">负责人:</span>
          <span className="value">{task.assigneeName || '未分配'}</span>
        </div>

        <div className="info-row">
          <span className="label">截止日期:</span>
          <span className={`value ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}`}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {dayjs(task.deadline).format('MM-DD HH:mm')}
            {isOverdue && <span style={{ marginLeft: 8, color: '#ff4d4f' }}>已逾期</span>}
            {isUrgent && <span style={{ marginLeft: 8, color: '#faad14' }}>即将逾期</span>}
          </span>
        </div>
      </div>

      {/* 进度条 */}
      {task.taskStatus === 2 && (
        <div className="task-progress">
          <div className="progress-label">
            <span>进度</span>
            <span className="progress-value">{task.progress || 0}%</span>
          </div>
          <Progress
            percent={task.progress || 0}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            showInfo={false}
          />
        </div>
      )}

      {/* 操作按钮 */}
      <div className="card-footer">
        <Button
          size="large"
          icon={<EyeOutlined />}
          onClick={() => onViewDetail(task)}
        >
          查看详情
        </Button>

        {task.taskStatus === 2 && (
          <Button
            type="primary"
            size="large"
            icon={<EditOutlined />}
            onClick={() => onUpdateProgress(task)}
          >
            更新进度
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * 移动端任务筛选组件（简化版）
 */
export const MobileTaskFilter = ({ filters, onSearch, onReset }) => {
  const [localFilters, setLocalFilters] = React.useState(filters);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    onSearch(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      taskStatus: null,
      taskType: null,
      assigneeId: null
    };
    setLocalFilters(resetFilters);
    onReset(resetFilters);
  };

  return (
    <div className="mobile-task-filter">
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 状态筛选 */}
        <div className="filter-row">
          <span className="filter-label">任务状态:</span>
          <Space wrap>
            <Tag.CheckableTag
              checked={localFilters.taskStatus === null}
              onChange={() => handleFilterChange('taskStatus', null)}
            >
              全部
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={localFilters.taskStatus === 2}
              onChange={() => handleFilterChange('taskStatus', 2)}
            >
              进行中
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={localFilters.taskStatus === 1}
              onChange={() => handleFilterChange('taskStatus', 1)}
            >
              未开始
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={localFilters.taskStatus === 3}
              onChange={() => handleFilterChange('taskStatus', 3)}
            >
              已完成
            </Tag.CheckableTag>
          </Space>
        </div>

        {/* 操作按钮 */}
        <div className="filter-actions">
          <Button type="primary" onClick={handleSearch} block>
            搜索
          </Button>
        </div>
      </Space>
    </div>
  );
};
