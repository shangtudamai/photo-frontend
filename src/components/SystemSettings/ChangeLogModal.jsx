/**
 * 参数变更日志弹窗
 */

import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, Select, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getChangeLogs } from '@/services/settingService';

const { Search } = Input;
const { Option } = Select;

function ChangeLogModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [searchKey, setSearchKey] = useState('');

  // 加载变更日志
  const loadLogs = async (page = 1, limit = 20, parameterKey = null) => {
    setLoading(true);
    try {
      const res = await getChangeLogs(parameterKey, page, limit);

      if (res.code === 200) {
        setLogs(res.data.data);
        setPagination({
          current: res.data.page,
          pageSize: res.data.limit,
          total: res.data.total
        });
      } else {
        message.error(res.message || '加载变更日志失败');
      }
    } catch (error) {
      console.error('Error loading change logs:', error);
      message.error('加载变更日志失败');
    } finally {
      setLoading(false);
    }
  };

  // 弹窗打开时加载数据
  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible]);

  // 搜索
  const handleSearch = (value) => {
    setSearchKey(value);
    loadLogs(1, pagination.pageSize, value || null);
  };

  // 清空搜索
  const handleClearSearch = () => {
    setSearchKey('');
    loadLogs(1, pagination.pageSize, null);
  };

  // 分页变化
  const handleTableChange = (newPagination) => {
    loadLogs(
      newPagination.current,
      newPagination.pageSize,
      searchKey || null
    );
  };

  // 表格列
  const columns = [
    {
      title: '参数键',
      dataIndex: 'parameterKey',
      key: 'parameterKey',
      width: 250,
      ellipsis: true
    },
    {
      title: '旧值',
      dataIndex: 'oldValue',
      key: 'oldValue',
      width: 200,
      ellipsis: true,
      render: (text) => (
        <span className="value-cell" title={text}>
          {text || '-'}
        </span>
      )
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      key: 'newValue',
      width: 200,
      ellipsis: true,
      render: (text) => (
        <span className="value-cell" title={text}>
          {text}
        </span>
      )
    },
    {
      title: '变更原因',
      dataIndex: 'changeReason',
      key: 'changeReason',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '更新人',
      dataIndex: 'updatedByName',
      key: 'updatedByName',
      width: 100
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '变更时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  return (
    <Modal
      title="参数变更日志"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnClose
    >
      {/* 搜索栏 */}
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="输入参数键进行搜索"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          style={{ width: 400 }}
        />
        {searchKey && (
          <span style={{ marginLeft: 16, color: '#999' }}>
            搜索：{searchKey}
            <a onClick={handleClearSearch} style={{ marginLeft: 8 }}>
              清空
            </a>
          </span>
        )}
      </div>

      {/* 变更日志表格 */}
      <Table
        dataSource={logs}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        onChange={handleTableChange}
        rowKey="logId"
        size="small"
        scroll={{ x: 1100 }}
      />
    </Modal>
  );
}

export default ChangeLogModal;
