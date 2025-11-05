import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useSelector } from 'react-redux';
import ClientSearchBar from './ClientSearchBar';
import ClientTable from './ClientTable';
import ClientFormDrawer from './ClientFormDrawer';
import ClientDetailDrawer from './ClientDetailDrawer';
import { getClientList } from '../../services/clientService';
import './ClientList.less';

/**
 * 客户管理主组件
 */
const ClientList = () => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0
  });
  const [searchParams, setSearchParams] = useState({});

  // Drawer状态
  const [formDrawerVisible, setFormDrawerVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);

  // 当前操作的客户
  const [editData, setEditData] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);

  // 从Redux获取当前用户信息
  const currentUser = useSelector((state) => state.user?.currentUser);

  // 检查是否有编辑权限
  const hasEditPermission = useCallback(() => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('admin') ||
           currentUser.roles.includes('client_manager');
  }, [currentUser]);

  // 初始加载
  useEffect(() => {
    fetchClients();
  }, []);

  // 获取客户列表
  const fetchClients = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...searchParams,
        ...params
      };

      const res = await getClientList(queryParams);

      if (res.code === 200) {
        setClients(res.data.data || []);
        setPagination({
          current: res.data.page || 1,
          pageSize: res.data.limit || 15,
          total: res.data.total || 0
        });
      } else {
        message.error(res.message || '获取客户列表失败');
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (params) => {
    setSearchParams(params);
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
    fetchClients({
      ...params,
      page: 1,
      limit: pagination.pageSize
    });
  };

  // 处理重置
  const handleReset = () => {
    setSearchParams({});
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
    fetchClients({
      page: 1,
      limit: pagination.pageSize
    });
  };

  // 处理分页、排序变化
  const handlePageChange = (params) => {
    const newPagination = {
      current: params.page || pagination.current,
      pageSize: params.limit || pagination.pageSize,
      total: pagination.total
    };
    setPagination(newPagination);
    fetchClients(params);
  };

  // 显示新增客户抽屉
  const handleAddClient = () => {
    setEditData(null);
    setFormDrawerVisible(true);
  };

  // 显示编辑客户抽屉
  const handleEditClient = (client) => {
    setEditData(client);
    setFormDrawerVisible(true);
  };

  // 显示客户详情抽屉
  const handleViewClient = (client) => {
    setSelectedClientId(client.clientId);
    setDetailDrawerVisible(true);
  };

  // 关闭表单抽屉
  const handleFormDrawerClose = () => {
    setFormDrawerVisible(false);
    setEditData(null);
  };

  // 表单提交成功
  const handleFormDrawerSuccess = () => {
    fetchClients();
  };

  // 关闭详情抽屉
  const handleDetailDrawerClose = () => {
    setDetailDrawerVisible(false);
    setSelectedClientId(null);
  };

  // 从详情抽屉打开编辑
  const handleEditFromDetail = (client) => {
    setDetailDrawerVisible(false);
    setEditData(client);
    setFormDrawerVisible(true);
  };

  // 刷新客户列表
  const handleRefresh = () => {
    fetchClients();
  };

  return (
    <div className="client-list-container">
      <div className="page-header">
        <h2>客户管理</h2>
        <p>管理客户信息和历史订单数据</p>
      </div>

      {/* 搜索栏 */}
      <ClientSearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        onAddClient={handleAddClient}
        hasEditPermission={hasEditPermission()}
      />

      {/* 客户表格 */}
      <ClientTable
        data={clients}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onView={handleViewClient}
        onEdit={handleEditClient}
        onRefresh={handleRefresh}
        currentUser={currentUser}
      />

      {/* 新增/编辑客户抽屉 */}
      <ClientFormDrawer
        visible={formDrawerVisible}
        editData={editData}
        onClose={handleFormDrawerClose}
        onSuccess={handleFormDrawerSuccess}
      />

      {/* 客户详情抽屉 */}
      <ClientDetailDrawer
        visible={detailDrawerVisible}
        clientId={selectedClientId}
        onClose={handleDetailDrawerClose}
        onEdit={handleEditFromDetail}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ClientList;
