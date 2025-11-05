import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useSelector } from 'react-redux';
import OrderSearchBar from './OrderSearchBar';
import OrderTable from './OrderTable';
import CreateOrderModal from './CreateOrderModal';
import OrderDetailDrawer from './OrderDetailDrawer';
import { getOrderList } from '../../services/orderService';
import './OrderList.less';

/**
 * 订单管理主组件
 */
const OrderList = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchParams, setSearchParams] = useState({});
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // 从Redux获取当前用户信息
  const currentUser = useSelector((state) => state.user?.currentUser);

  // 检查是否有创建订单权限
  const hasCreatePermission = useCallback(() => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('admin') ||
           currentUser.roles.includes('client_manager');
  }, [currentUser]);

  // 初始加载
  useEffect(() => {
    fetchOrders();
  }, []);

  // 获取订单列表
  const fetchOrders = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...searchParams,
        ...params
      };

      const res = await getOrderList(queryParams);
      if (res.code === 200) {
        setOrders(res.data.data || []);
        setPagination({
          current: res.data.page || 1,
          pageSize: res.data.limit || 10,
          total: res.data.total || 0
        });
      } else {
        message.error(res.message || '获取订单列表失败');
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      message.error('获取订单列表失败');
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
    fetchOrders({
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
    fetchOrders({
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
    fetchOrders(params);
  };

  // 显示创建订单弹窗
  const handleCreate = () => {
    setEditData(null);
    setCreateModalVisible(true);
  };

  // 显示编辑订单弹窗
  const handleEdit = (record) => {
    setEditData(record);
    setCreateModalVisible(true);
  };

  // 显示订单详情
  const handleView = (record) => {
    setSelectedOrderId(record.orderId);
    setDetailDrawerVisible(true);
  };

  // 创建/编辑成功回调
  const handleModalSuccess = () => {
    fetchOrders();
  };

  // 关闭创建/编辑弹窗
  const handleModalCancel = () => {
    setCreateModalVisible(false);
    setEditData(null);
  };

  // 关闭详情抽屉
  const handleDrawerClose = () => {
    setDetailDrawerVisible(false);
    setSelectedOrderId(null);
  };

  // 刷新订单列表（用于状态更新后）
  const handleRefresh = () => {
    fetchOrders();
  };

  return (
    <div className="order-list-container">
      <div className="page-header">
        <h2>订单管理</h2>
        <p>管理和跟踪所有订单信息</p>
      </div>

      {/* 搜索栏 */}
      <OrderSearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        onCreate={handleCreate}
        hasCreatePermission={hasCreatePermission()}
      />

      {/* 订单表格 */}
      <OrderTable
        data={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
        currentUser={currentUser}
      />

      {/* 创建/编辑订单弹窗 */}
      <CreateOrderModal
        visible={createModalVisible}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
        editData={editData}
      />

      {/* 订单详情抽屉 */}
      <OrderDetailDrawer
        visible={detailDrawerVisible}
        orderId={selectedOrderId}
        onClose={handleDrawerClose}
        currentUser={currentUser}
      />
    </div>
  );
};

export default OrderList;
