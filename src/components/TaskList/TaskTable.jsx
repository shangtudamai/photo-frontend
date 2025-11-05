import React from 'react';
import { Table, Tag, Button, Space, Progress, Tooltip } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import './TaskTable.less';

/**
 * 任务表格组件
 */
const TaskTable = ({
  data,
  loading,
  pagination,
  onPageChange,
  onView,
  onUpdateProgress,
  onReturn,
  currentUser
}) => {
  // 任务状态映射
  const taskStatusMap = {
    1: { text: '未开始', color: 'default' },
    2: { text: '进行中', color: 'processing' },
    3: { text: '已完成', color: 'success' },
    4: { text: '已退回', color: 'error' }
  };

  // 任务类型映射
  const taskTypeMap = {
    'photography': { text: '拍摄', color: 'blue' },
    'retouching': { text: '后期', color: 'purple' }
  };

  // 获取截止日期状态
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return { type: 'normal', color: 'default' };

    const now = dayjs();
    const deadlineDate = dayjs(deadline);
    const hoursLeft = deadlineDate.diff(now, 'hour');

    if (hoursLeft < 0) {
      return { type: 'overdue', color: 'red', text: '已逾期' };
    } else if (hoursLeft < 24) {
      return { type: 'urgent', color: 'orange', text: '即将逾期' };
    }
    return { type: 'normal', color: 'default', text: '' };
  };

  // 渲染截止日期
  const renderDeadline = (deadline) => {
    const status = getDeadlineStatus(deadline);
    const dateStr = dayjs(deadline).format('YYYY-MM-DD HH:mm');

    if (status.type === 'normal') {
      return <span>{dateStr}</span>;
    }

    return (
      <Tooltip title={status.text}>
        <span style={{ color: status.color }}>
          <ExclamationCircleOutlined style={{ marginRight: 4 }} />
          {dateStr}
        </span>
      </Tooltip>
    );
  };

  // 检查是否可以更新进度
  const canUpdateProgress = (task) => {
    if (!currentUser || !currentUser.roles) return false;

    // 管理员可以更新所有任务
    if (currentUser.roles.includes('admin')) return true;

    // 任务负责人可以更新自己的任务（且状态不是已完成）
    return task.assigneeId === currentUser.userId && task.status !== 3;
  };

  // 检查是否可以退回任务
  const canReturnTask = (task) => {
    if (!currentUser || !currentUser.roles) return false;

    // 只有管理员可以退回任务，且任务状态必须是进行中或已完成
    return currentUser.roles.includes('admin') &&
           (task.status === 2 || task.status === 3);
  };

  // 表格列定义
  const columns = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 100,
      fixed: 'left'
    },
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
      render: (text, record) => (
        <a
          onClick={() => onView(record)}
          style={{ color: '#1890ff', cursor: 'pointer' }}
        >
          {text}
        </a>
      )
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 100,
      render: (type) => (
        <Tag color={taskTypeMap[type]?.color}>
          {taskTypeMap[type]?.text}
        </Tag>
      )
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 120,
      ellipsis: true
    },
    {
      title: '分配日期',
      dataIndex: 'assignDate',
      key: 'assignDate',
      width: 120,
      sorter: true,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 150,
      sorter: true,
      render: (deadline) => renderDeadline(deadline)
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress, record) => {
        const status = getDeadlineStatus(record.deadline);
        let strokeColor = '#1890ff';

        if (status.type === 'overdue') {
          strokeColor = '#ff4d4f';
        } else if (status.type === 'urgent') {
          strokeColor = '#fa8c16';
        }

        return (
          <Progress
            percent={progress || 0}
            size="small"
            strokeColor={strokeColor}
            style={{ minWidth: 120 }}
          />
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '未开始', value: 1 },
        { text: '进行中', value: 2 },
        { text: '已完成', value: 3 },
        { text: '已退回', value: 4 }
      ],
      render: (status) => (
        <Tag color={taskStatusMap[status]?.color}>
          {taskStatusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
          >
            详情
          </Button>

          {canUpdateProgress(record) && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => onUpdateProgress(record)}
            >
              更新进度
            </Button>
          )}

          {canReturnTask(record) && (
            <Button
              type="link"
              size="small"
              danger
              icon={<RollbackOutlined />}
              onClick={() => onReturn(record)}
            >
              退回
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 处理表格变化
  const handleTableChange = (pagination, filters, sorter) => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...filters
    };

    // 处理排序
    if (sorter.field) {
      params.sort_by = sorter.field;
      params.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    onPageChange(params);
  };

  return (
    <div className="task-table">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="taskId"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
        size="middle"
      />
    </div>
  );
};

export default TaskTable;
