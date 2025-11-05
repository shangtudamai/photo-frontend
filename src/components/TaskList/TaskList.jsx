import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useSelector } from 'react-redux';
import TaskFilter from './TaskFilter';
import TaskTable from './TaskTable';
import AssignTaskModal from './AssignTaskModal';
import ProgressUpdateModal from './ProgressUpdateModal';
import ReturnTaskModal from './ReturnTaskModal';
import TaskDetailDrawer from './TaskDetailDrawer';
import { getTaskList, getMyTasks, getTaskStatistics } from '../../services/taskService';
import './TaskList.less';

/**
 * 任务管理主组件
 */
const TaskList = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({});
  const [currentTab, setCurrentTab] = useState('my'); // my: 我的任务, all: 所有任务
  const [taskStats, setTaskStats] = useState(null);

  // Modal和Drawer状态
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);

  // 当前操作的任务
  const [currentTask, setCurrentTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // 从Redux获取当前用户信息
  const currentUser = useSelector((state) => state.user?.currentUser);

  // 初始加载
  useEffect(() => {
    fetchTasks();
    fetchTaskStats();
  }, []);

  // 获取任务列表
  const fetchTasks = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
        ...params
      };

      let res;
      if (currentTab === 'my') {
        // 获取我的任务
        res = await getMyTasks(queryParams);
      } else {
        // 获取所有任务
        res = await getTaskList(queryParams);
      }

      if (res.code === 200) {
        setTasks(res.data.data || []);
        setPagination({
          current: res.data.page || 1,
          pageSize: res.data.limit || 10,
          total: res.data.total || 0
        });
      } else {
        message.error(res.message || '获取任务列表失败');
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取任务统计数据
  const fetchTaskStats = async () => {
    try {
      const res = await getTaskStatistics();
      if (res.code === 200) {
        setTaskStats(res.data);
      }
    } catch (error) {
      console.error('获取任务统计失败:', error);
    }
  };

  // 处理标签切换
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setPagination(prev => ({
      ...prev,
      current: 1
    }));

    // 重新获取数据
    setTimeout(() => {
      fetchTasks({
        page: 1,
        limit: pagination.pageSize
      });
    }, 0);
  };

  // 处理筛选条件变化
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
    fetchTasks({
      ...newFilters,
      page: 1,
      limit: pagination.pageSize
    });
  };

  // 处理分页、筛选、排序变化
  const handlePageChange = (params) => {
    const newPagination = {
      current: params.page || pagination.current,
      pageSize: params.limit || pagination.pageSize,
      total: pagination.total
    };
    setPagination(newPagination);
    fetchTasks(params);
  };

  // 显示分配任务弹窗
  const handleAssignTask = () => {
    setAssignModalVisible(true);
  };

  // 显示更新进度弹窗
  const handleUpdateProgress = (task) => {
    setCurrentTask(task);
    setProgressModalVisible(true);
  };

  // 显示退回任务弹窗
  const handleReturnTask = (task) => {
    setCurrentTask(task);
    setReturnModalVisible(true);
  };

  // 显示任务详情
  const handleViewTask = (task) => {
    setSelectedTaskId(task.taskId);
    setDetailDrawerVisible(true);
  };

  // 关闭分配任务弹窗
  const handleAssignModalCancel = () => {
    setAssignModalVisible(false);
  };

  // 分配任务成功
  const handleAssignModalSuccess = () => {
    fetchTasks();
    fetchTaskStats();
  };

  // 关闭进度更新弹窗
  const handleProgressModalCancel = () => {
    setProgressModalVisible(false);
    setCurrentTask(null);
  };

  // 进度更新成功
  const handleProgressModalSuccess = () => {
    fetchTasks();
    fetchTaskStats();
  };

  // 关闭退回任务弹窗
  const handleReturnModalCancel = () => {
    setReturnModalVisible(false);
    setCurrentTask(null);
  };

  // 退回任务成功
  const handleReturnModalSuccess = () => {
    fetchTasks();
    fetchTaskStats();
  };

  // 关闭详情抽屉
  const handleDetailDrawerClose = () => {
    setDetailDrawerVisible(false);
    setSelectedTaskId(null);
  };

  // 刷新任务列表
  const handleRefresh = () => {
    fetchTasks();
    fetchTaskStats();
  };

  return (
    <div className="task-list-container">
      <div className="page-header">
        <h2>任务管理</h2>
        <p>分配、跟踪和管理摄影任务</p>
      </div>

      {/* 筛选器 */}
      <TaskFilter
        onFilterChange={handleFilterChange}
        onTabChange={handleTabChange}
        onAssignTask={handleAssignTask}
        onRefresh={handleRefresh}
        currentUser={currentUser}
        taskStats={taskStats}
      />

      {/* 任务表格 */}
      <TaskTable
        data={tasks}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onView={handleViewTask}
        onUpdateProgress={handleUpdateProgress}
        onReturn={handleReturnTask}
        currentUser={currentUser}
      />

      {/* 分配任务弹窗 */}
      <AssignTaskModal
        visible={assignModalVisible}
        onCancel={handleAssignModalCancel}
        onSuccess={handleAssignModalSuccess}
      />

      {/* 更新进度弹窗 */}
      <ProgressUpdateModal
        visible={progressModalVisible}
        task={currentTask}
        onCancel={handleProgressModalCancel}
        onSuccess={handleProgressModalSuccess}
      />

      {/* 退回任务弹窗 */}
      <ReturnTaskModal
        visible={returnModalVisible}
        task={currentTask}
        onCancel={handleReturnModalCancel}
        onSuccess={handleReturnModalSuccess}
      />

      {/* 任务详情抽屉 */}
      <TaskDetailDrawer
        visible={detailDrawerVisible}
        taskId={selectedTaskId}
        onClose={handleDetailDrawerClose}
        currentUser={currentUser}
      />
    </div>
  );
};

export default TaskList;
