import React, { useState, useEffect } from 'react';
import { message, Result, Button } from 'antd';
import { useSelector, useNavigate } from 'react-redux';
import { LockOutlined } from '@ant-design/icons';
import UserSearchBar from './UserSearchBar';
import UserTable from './UserTable';
import UserFormDrawer from './UserFormDrawer';
import ResetPasswordModal from './ResetPasswordModal';
import { getUserList } from '../../services/userService';
import './UserList.less';

/**
 * 用户管理主组件
 * 仅管理员可访问
 */
const UserList = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchParams, setSearchParams] = useState({});

  // Drawer和Modal状态
  const [formDrawerVisible, setFormDrawerVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);

  // 当前操作的用户
  const [editData, setEditData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // 从Redux获取当前用户信息
  const currentUser = useSelector((state) => state.user?.currentUser);
  const navigate = useNavigate();

  // 检查是否是管理员
  const isAdmin = () => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('admin');
  };

  // 初始加载
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, []);

  // 如果不是管理员，显示无权限页面
  if (!isAdmin()) {
    return (
      <div className="user-list-container">
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面。"
          icon={<LockOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />}
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
          }
        />
      </div>
    );
  }

  // 获取用户列表
  const fetchUsers = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...searchParams,
        ...params
      };

      const res = await getUserList(queryParams);

      if (res.code === 200) {
        setUsers(res.data.data || []);
        setPagination({
          current: res.data.page || 1,
          pageSize: res.data.limit || 10,
          total: res.data.total || 0
        });
      } else {
        message.error(res.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
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
    fetchUsers({
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
    fetchUsers({
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
    fetchUsers(params);
  };

  // 显示新增用户抽屉
  const handleAddUser = () => {
    setEditData(null);
    setFormDrawerVisible(true);
  };

  // 显示编辑用户抽屉
  const handleEditUser = (user) => {
    setEditData(user);
    setFormDrawerVisible(true);
  };

  // 显示重置密码弹窗
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setResetPasswordModalVisible(true);
  };

  // 关闭表单抽屉
  const handleFormDrawerClose = () => {
    setFormDrawerVisible(false);
    setEditData(null);
  };

  // 表单提交成功
  const handleFormDrawerSuccess = () => {
    fetchUsers();
  };

  // 关闭重置密码弹窗
  const handleResetPasswordModalClose = () => {
    setResetPasswordModalVisible(false);
    setSelectedUser(null);
  };

  // 重置密码成功
  const handleResetPasswordSuccess = () => {
    // 不需要刷新列表，只是重置了密码
  };

  // 刷新用户列表
  const handleRefresh = () => {
    fetchUsers();
  };

  return (
    <div className="user-list-container">
      <div className="page-header">
        <h2>用户管理</h2>
        <p>管理系统用户账号和权限</p>
      </div>

      {/* 搜索栏 */}
      <UserSearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        onAddUser={handleAddUser}
      />

      {/* 用户表格 */}
      <UserTable
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={handleEditUser}
        onResetPassword={handleResetPassword}
        onRefresh={handleRefresh}
      />

      {/* 新增/编辑用户抽屉 */}
      <UserFormDrawer
        visible={formDrawerVisible}
        editData={editData}
        onClose={handleFormDrawerClose}
        onSuccess={handleFormDrawerSuccess}
      />

      {/* 重置密码弹窗 */}
      <ResetPasswordModal
        visible={resetPasswordModalVisible}
        user={selectedUser}
        onCancel={handleResetPasswordModalClose}
        onSuccess={handleResetPasswordSuccess}
      />
    </div>
  );
};

export default UserList;
