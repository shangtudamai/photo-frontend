import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Tabs,
  Descriptions,
  Tag,
  Timeline,
  Upload,
  Button,
  message,
  Image,
  Card,
  Space,
  Empty,
  Modal,
  Progress
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import {
  getTaskDetail,
  getTaskProgressHistory,
  getTaskResults,
  uploadTaskResult,
  deleteTaskResult
} from '../../services/taskService';
import dayjs from 'dayjs';
import './TaskDetailDrawer.less';

const { TabPane } = Tabs;

/**
 * 任务详情抽屉组件
 */
const TaskDetailDrawer = ({ visible, taskId, onClose, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [taskDetail, setTaskDetail] = useState(null);
  const [progressHistory, setProgressHistory] = useState([]);
  const [taskResults, setTaskResults] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    if (visible && taskId) {
      fetchTaskDetail();
      fetchProgressHistory();
      fetchTaskResults();
    }
  }, [visible, taskId]);

  // 获取任务详情
  const fetchTaskDetail = async () => {
    setLoading(true);
    try {
      const res = await getTaskDetail(taskId);
      if (res.code === 200) {
        setTaskDetail(res.data);
      }
    } catch (error) {
      console.error('获取任务详情失败:', error);
      message.error('获取任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取进度历史记录
  const fetchProgressHistory = async () => {
    try {
      const res = await getTaskProgressHistory(taskId);
      if (res.code === 200) {
        setProgressHistory(res.data || []);
      }
    } catch (error) {
      console.error('获取进度历史失败:', error);
    }
  };

  // 获取任务成果
  const fetchTaskResults = async () => {
    try {
      const res = await getTaskResults(taskId);
      if (res.code === 200) {
        setTaskResults(res.data || []);
      }
    } catch (error) {
      console.error('获取任务成果失败:', error);
    }
  };

  // 处理文件上传
  const handleUpload = async (file) => {
    // 文件类型验证
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      message.error('只支持上传 JPG、PNG、MP4 格式的文件');
      return false;
    }

    // 文件大小验证（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error('文件大小不能超过 10MB');
      return false;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await uploadTaskResult(taskId, formData);
      if (res.code === 200) {
        message.success('文件上传成功');
        fetchTaskResults();
      } else {
        message.error(res.message || '文件上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error('文件上传失败');
    } finally {
      setUploading(false);
    }

    return false; // 阻止自动上传
  };

  // 处理文件删除
  const handleDeleteResult = async (resultId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该文件吗？',
      onOk: async () => {
        try {
          const res = await deleteTaskResult(taskId, resultId);
          if (res.code === 200) {
            message.success('删除成功');
            fetchTaskResults();
          } else {
            message.error(res.message || '删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败');
        }
      }
    });
  };

  // 检查是否可以上传成果
  const canUploadResults = () => {
    if (!currentUser || !taskDetail) return false;

    // 管理员可以上传
    if (currentUser.roles?.includes('admin')) return true;

    // 任务负责人可以上传
    return taskDetail.assigneeId === currentUser.userId;
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
    return { type: 'normal', color: 'default', text: '正常' };
  };

  // 渲染任务详情标签页
  const renderDetailTab = () => {
    if (!taskDetail) return null;

    const deadlineStatus = getDeadlineStatus(taskDetail.deadline);

    return (
      <div className="tab-content">
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="任务ID">
              {taskDetail.taskId}
            </Descriptions.Item>
            <Descriptions.Item label="任务类型">
              <Tag color={taskTypeMap[taskDetail.taskType]?.color}>
                {taskTypeMap[taskDetail.taskType]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="关联订单">
              {taskDetail.orderNo}
            </Descriptions.Item>
            <Descriptions.Item label="客户名称">
              {taskDetail.clientName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="负责人">
              {taskDetail.assigneeName}
            </Descriptions.Item>
            <Descriptions.Item label="分配人">
              {taskDetail.assignerName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="分配日期">
              {dayjs(taskDetail.assignDate).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="截止日期">
              <span style={{ color: deadlineStatus.color }}>
                {dayjs(taskDetail.deadline).format('YYYY-MM-DD HH:mm')}
                {deadlineStatus.text && ` (${deadlineStatus.text})`}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="任务状态">
              <Tag color={taskStatusMap[taskDetail.status]?.color}>
                {taskStatusMap[taskDetail.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="任务进度">
              <Progress percent={taskDetail.progress || 0} size="small" />
            </Descriptions.Item>
            <Descriptions.Item label="任务描述" span={2}>
              {taskDetail.description || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 退回信息 */}
        {taskDetail.status === 4 && taskDetail.returnInfo && (
          <Card title="退回信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="退回类型">
                {taskDetail.returnInfo.returnType === 'reshoot' ? '重拍' :
                 taskDetail.returnInfo.returnType === 'retouch' ? '重修' : '补拍/补修'}
              </Descriptions.Item>
              <Descriptions.Item label="退回原因">
                {taskDetail.returnInfo.reason}
              </Descriptions.Item>
              <Descriptions.Item label="退回时间">
                {dayjs(taskDetail.returnInfo.returnTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="退回人">
                {taskDetail.returnInfo.returnByName}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </div>
    );
  };

  // 渲染进度记录标签页
  const renderProgressTab = () => (
    <div className="tab-content">
      {progressHistory.length > 0 ? (
        <Timeline mode="left">
          {progressHistory.map((record, index) => (
            <Timeline.Item
              key={index}
              label={dayjs(record.updateTime).format('YYYY-MM-DD HH:mm:ss')}
              color={record.progress === 100 ? 'green' : 'blue'}
            >
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <strong>{record.updaterName}</strong>
                    <span style={{ margin: '0 8px', color: '#999' }}>将进度更新为</span>
                    <Tag color="blue">{record.progress}%</Tag>
                  </div>
                  {record.remark && (
                    <div className="progress-remark">
                      <strong>说明：</strong>{record.remark}
                    </div>
                  )}
                  {record.statusChange && (
                    <div style={{ color: '#52c41a' }}>
                      状态变更：{record.statusChange}
                    </div>
                  )}
                </Space>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        <Empty description="暂无进度记录" />
      )}
    </div>
  );

  // 渲染成果上传标签页
  const renderResultsTab = () => (
    <div className="tab-content">
      {canUploadResults() && (
        <div style={{ marginBottom: 16 }}>
          <Upload
            beforeUpload={handleUpload}
            showUploadList={false}
            multiple
            accept=".jpg,.jpeg,.png,.mp4"
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              上传文件
            </Button>
          </Upload>
          <span style={{ marginLeft: 16, color: '#999', fontSize: 12 }}>
            支持 JPG、PNG、MP4 格式，单个文件不超过 10MB
          </span>
        </div>
      )}

      {taskResults.length > 0 ? (
        <div className="results-grid">
          {taskResults.map((result) => (
            <Card
              key={result.resultId}
              size="small"
              className="result-card"
              cover={
                result.fileType?.startsWith('image/') ? (
                  <Image
                    src={result.fileUrl}
                    alt={result.fileName}
                    style={{ height: 200, objectFit: 'cover' }}
                  />
                ) : (
                  <div className="video-cover">
                    <PlayCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    <div style={{ marginTop: 8 }}>视频文件</div>
                  </div>
                )
              }
            >
              <Card.Meta
                title={result.fileName}
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div className="file-info">
                      大小: {(result.fileSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div className="file-info">
                      上传时间: {dayjs(result.uploadTime).format('YYYY-MM-DD HH:mm')}
                    </div>
                    <div className="file-info">
                      上传人: {result.uploaderName}
                    </div>
                  </Space>
                }
              />
              <div className="card-actions">
                <Button
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  href={result.fileUrl}
                  download={result.fileName}
                >
                  下载
                </Button>
                {canUploadResults() && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteResult(result.resultId)}
                  >
                    删除
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty description="暂无上传成果" />
      )}
    </div>
  );

  return (
    <Drawer
      title="任务详情"
      placement="right"
      width={800}
      open={visible}
      onClose={onClose}
      destroyOnClose
      className="task-detail-drawer"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="任务详情" key="1">
          {renderDetailTab()}
        </TabPane>
        <TabPane tab="进度记录" key="2">
          {renderProgressTab()}
        </TabPane>
        <TabPane tab="成果上传" key="3">
          {renderResultsTab()}
        </TabPane>
      </Tabs>
    </Drawer>
  );
};

export default TaskDetailDrawer;
