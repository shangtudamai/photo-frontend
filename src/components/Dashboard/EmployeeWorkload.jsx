import React from 'react';
import { Card, List, Progress, Tag, Avatar, Tooltip } from 'antd';
import { UserOutlined, CameraOutlined, PictureOutlined } from '@ant-design/icons';
import './EmployeeWorkload.less';

/**
 * 员工产能负载组件
 */
const EmployeeWorkload = ({ workloads, loading }) => {
  // 获取负载状态标签
  const getWorkloadStatus = (percentage) => {
    if (percentage >= 80) {
      return { text: '过载', color: 'error' };
    } else if (percentage >= 50) {
      return { text: '正常', color: 'processing' };
    } else {
      return { text: '空闲', color: 'success' };
    }
  };

  // 获取负载进度条颜色
  const getProgressColor = (percentage) => {
    if (percentage >= 80) {
      return '#ff4d4f';
    } else if (percentage >= 50) {
      return '#1890ff';
    } else {
      return '#52c41a';
    }
  };

  // 获取角色图标
  const getRoleIcon = (roleCode) => {
    switch (roleCode) {
      case 'photographer':
        return <CameraOutlined />;
      case 'retoucher':
        return <PictureOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  // 获取角色名称
  const getRoleName = (roleCode) => {
    const roleMap = {
      photographer: '摄影师',
      retoucher: '后期',
      client_manager: '客户经理',
      admin: '管理员'
    };
    return roleMap[roleCode] || roleCode;
  };

  return (
    <Card
      title="员工产能负载"
      className="employee-workload-card"
    >
      <List
        loading={loading}
        dataSource={workloads}
        renderItem={(item) => {
          const status = getWorkloadStatus(item.workloadPercentage);
          const progressColor = getProgressColor(item.workloadPercentage);

          return (
            <List.Item className="workload-item">
              <div className="employee-info">
                <Avatar
                  icon={getRoleIcon(item.roleCode)}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <div className="employee-details">
                  <div className="employee-header">
                    <span className="employee-name">{item.employeeName}</span>
                    <Tag color="blue" className="role-tag">
                      {getRoleName(item.roleCode)}
                    </Tag>
                  </div>
                  <div className="workload-info">
                    <Tooltip title={`当前任务：${item.currentTasks} / 总容量：${item.maxCapacity}`}>
                      <Progress
                        percent={item.workloadPercentage}
                        size="small"
                        strokeColor={progressColor}
                        format={(percent) => `${percent}%`}
                      />
                    </Tooltip>
                    <Tag
                      color={status.color}
                      className="status-tag"
                    >
                      {status.text}
                    </Tag>
                  </div>
                  <div className="task-summary">
                    <span className="task-count">
                      当前任务：{item.currentTasks || 0}
                    </span>
                    <span className="pending-pieces">
                      待处理件数：{item.pendingPieces || 0}
                    </span>
                  </div>
                </div>
              </div>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default EmployeeWorkload;
