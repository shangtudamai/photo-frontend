import React, { useState } from 'react';
import { Row, Col, Input, Select, Button, Space } from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import './UserSearchBar.less';

const { Option } = Select;

/**
 * 用户搜索栏组件
 */
const UserSearchBar = ({ onSearch, onReset, onAddUser }) => {
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    role: undefined
  });

  // 角色选项
  const roleOptions = [
    { label: '全部角色', value: undefined },
    { label: '管理员', value: 'admin' },
    { label: '客户对接人', value: 'client_manager' },
    { label: '摄影师', value: 'photographer' },
    { label: '后期', value: 'retoucher' },
    { label: '财务', value: 'finance' }
  ];

  // 处理搜索参数变化
  const handleChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理搜索
  const handleSearch = () => {
    const params = {
      keyword: searchParams.keyword || undefined,
      role: searchParams.role
    };

    // 移除undefined的参数
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    onSearch(params);
  };

  // 处理重置
  const handleReset = () => {
    setSearchParams({
      keyword: '',
      role: undefined
    });
    onReset();
  };

  // 回车搜索
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="user-search-bar">
      <Row gutter={[16, 16]} align="middle">
        {/* 关键词搜索 */}
        <Col xs={24} sm={12} md={8} lg={8}>
          <Input
            placeholder="搜索用户名、姓名"
            prefix={<SearchOutlined />}
            value={searchParams.keyword}
            onChange={(e) => handleChange('keyword', e.target.value)}
            onPressEnter={handleKeyPress}
            allowClear
          />
        </Col>

        {/* 角色筛选 */}
        <Col xs={24} sm={12} md={6} lg={6}>
          <Select
            placeholder="选择角色"
            value={searchParams.role}
            onChange={(value) => handleChange('role', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {roleOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>

        {/* 操作按钮 */}
        <Col xs={24} sm={24} md={10} lg={10}>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              搜索
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddUser}
            >
              新增用户
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default UserSearchBar;
