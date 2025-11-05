import React, { useState, useEffect } from 'react';
import { Row, Col, Input, Select, Button, Space } from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { getClientTags } from '../../services/clientService';
import './ClientSearchBar.less';

const { Option } = Select;

/**
 * 客户搜索栏组件
 */
const ClientSearchBar = ({ onSearch, onReset, onAddClient, hasEditPermission }) => {
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    tags: [],
    clientLevel: undefined
  });
  const [availableTags, setAvailableTags] = useState([]);

  // 客户等级选项
  const levelOptions = [
    { label: '全部等级', value: undefined },
    { label: '普通客户', value: 'normal' },
    { label: 'VIP客户', value: 'vip' }
  ];

  // 加载标签列表
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await getClientTags();
      if (res.code === 200) {
        setAvailableTags(res.data || []);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    }
  };

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
      tags: searchParams.tags.length > 0 ? searchParams.tags : undefined,
      client_level: searchParams.clientLevel
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
      tags: [],
      clientLevel: undefined
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
    <div className="client-search-bar">
      <Row gutter={[16, 16]} align="middle">
        {/* 关键词搜索 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="搜索客户名称"
            prefix={<SearchOutlined />}
            value={searchParams.keyword}
            onChange={(e) => handleChange('keyword', e.target.value)}
            onPressEnter={handleKeyPress}
            allowClear
          />
        </Col>

        {/* 标签筛选 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            mode="multiple"
            placeholder="选择标签（多选）"
            value={searchParams.tags}
            onChange={(value) => handleChange('tags', value)}
            style={{ width: '100%' }}
            allowClear
            maxTagCount={2}
          >
            {availableTags.map(tag => (
              <Option key={tag.tagId} value={tag.tagId}>
                {tag.tagName}
              </Option>
            ))}
          </Select>
        </Col>

        {/* 客户等级筛选 */}
        <Col xs={24} sm={12} md={6} lg={4}>
          <Select
            placeholder="客户等级"
            value={searchParams.clientLevel}
            onChange={(value) => handleChange('clientLevel', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {levelOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>

        {/* 操作按钮 */}
        <Col xs={24} sm={24} md={24} lg={8}>
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
            {hasEditPermission && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAddClient}
              >
                新增客户
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ClientSearchBar;
