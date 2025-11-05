/**
 * 操作日志页面
 * 仅管理员可见
 */

import React, { useState, useEffect } from 'react';
import { Card, message, Result, Button } from 'antd';
import { useSelector } from 'react-redux';
import { FileTextOutlined } from '@ant-design/icons';
import LogFilter from './LogFilter';
import LogTable from './LogTable';
import LogDetailModal from './LogDetailModal';
import { getLogs, exportLogs } from '@/services/logService';
import dayjs from 'dayjs';
import './OperationLog.less';

function OperationLog() {
  // Redux state
  const currentUser = useSelector((state) => state.user?.currentUser);

  // 本地 state
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    userId: null,
    operationType: null,
    targetType: null,
    startTime: null,
    endTime: null
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // 权限检查
  const hasAdminPermission = () => {
    return currentUser?.roles?.includes('admin');
  };

  // 加载日志
  const loadLogs = async (page = 1, pageSize = 20, customFilters = filters) => {
    setLoading(true);
    try {
      const res = await getLogs({
        ...customFilters,
        page,
        limit: pageSize
      });

      if (res.code === 200) {
        setLogs(res.data.data);
        setPagination({
          current: res.data.page,
          pageSize: res.data.limit,
          total: res.data.total
        });
      } else {
        message.error(res.message || '加载日志失败');
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      message.error('加载日志失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (hasAdminPermission()) {
      // 默认查询最近7天的日志
      const defaultFilters = {
        startTime: dayjs().subtract(7, 'day').format('YYYY-MM-DD 00:00:00'),
        endTime: dayjs().format('YYYY-MM-DD 23:59:59')
      };
      setFilters(defaultFilters);
      loadLogs(1, 20, defaultFilters);
    }
  }, []);

  // 搜索
  const handleSearch = (searchFilters) => {
    setFilters(searchFilters);
    loadLogs(1, pagination.pageSize, searchFilters);
  };

  // 重置
  const handleReset = () => {
    const defaultFilters = {
      userId: null,
      operationType: null,
      targetType: null,
      startTime: dayjs().subtract(7, 'day').format('YYYY-MM-DD 00:00:00'),
      endTime: dayjs().format('YYYY-MM-DD 23:59:59')
    };
    setFilters(defaultFilters);
    loadLogs(1, pagination.pageSize, defaultFilters);
  };

  // 分页变化
  const handleTableChange = (newPagination) => {
    loadLogs(newPagination.current, newPagination.pageSize);
  };

  // 查看详情
  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  // 导出
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await exportLogs(filters);

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `operation_logs_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      message.success('导出成功');
    } catch (error) {
      console.error('Error exporting logs:', error);
      message.error('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  // 如果不是管理员，显示 403 页面
  if (!hasAdminPermission()) {
    return (
      <div className="operation-log-container">
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面。仅管理员可以查看操作日志。"
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
    <div className="operation-log-container">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <FileTextOutlined className="header-icon" />
          <div>
            <h2>操作日志</h2>
            <p>记录用户关键操作，用于审计和问题追溯</p>
          </div>
        </div>
      </div>

      {/* 搜索筛选区 */}
      <Card className="filter-card">
        <LogFilter
          filters={filters}
          onSearch={handleSearch}
          onReset={handleReset}
          onExport={handleExport}
          exportLoading={exportLoading}
        />
      </Card>

      {/* 日志列表 */}
      <Card className="table-card">
        <LogTable
          loading={loading}
          logs={logs}
          pagination={pagination}
          onTableChange={handleTableChange}
          onViewDetail={handleViewDetail}
        />
      </Card>

      {/* 详情弹窗 */}
      <LogDetailModal
        visible={detailModalVisible}
        log={selectedLog}
        onClose={() => setDetailModalVisible(false)}
      />
    </div>
  );
}

export default OperationLog;
