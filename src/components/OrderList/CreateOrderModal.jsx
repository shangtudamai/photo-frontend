import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Table,
  Radio,
  message,
  Divider,
  Row,
  Col,
  Card
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import {
  createOrder,
  updateOrder,
  getClientList,
  getClientDetail,
  getEffectTypes
} from '../../services/orderService';
import './CreateOrderModal.less';

const { Option } = Select;
const { TextArea } = Input;

/**
 * 创建/编辑订单Modal组件
 */
const CreateOrderModal = ({ visible, onCancel, onSuccess, editData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [effectTypes, setEffectTypes] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [productItems, setProductItems] = useState([{ key: 0 }]);
  const [extraFees, setExtraFees] = useState([]);
  const [discountType, setDiscountType] = useState('percentage'); // percentage or fixed
  const [amounts, setAmounts] = useState({
    baseAmount: 0,
    discountAmount: 0,
    extraAmount: 0,
    finalAmount: 0
  });

  const isEditMode = !!editData;

  useEffect(() => {
    if (visible) {
      fetchClients();
      fetchEffectTypes();

      if (isEditMode) {
        loadEditData();
      } else {
        resetForm();
      }
    }
  }, [visible, editData]);

  // 加载客户列表
  const fetchClients = async () => {
    try {
      const res = await getClientList();
      if (res.code === 200) {
        setClients(res.data.data || []);
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  // 加载效果类型
  const fetchEffectTypes = async () => {
    try {
      const res = await getEffectTypes();
      if (res.code === 200) {
        setEffectTypes(res.data || []);
      }
    } catch (error) {
      // 如果接口不存在，使用默认数据
      setEffectTypes([
        { id: 1, name: '平铺', minPrice: 2, maxPrice: 5 },
        { id: 2, name: '挂拍', minPrice: 3, maxPrice: 8 },
        { id: 3, name: '模特', minPrice: 15, maxPrice: 30 },
        { id: 4, name: '视频', minPrice: 50, maxPrice: 150 }
      ]);
    }
  };

  // 加载编辑数据
  const loadEditData = () => {
    if (editData) {
      form.setFieldsValue({
        clientId: editData.clientId,
        shootingType: editData.shootingType,
        priority: editData.priority,
        remark: editData.remark
      });

      // 加载产品明细
      if (editData.items) {
        setProductItems(editData.items.map((item, index) => ({
          key: index,
          effectType: item.effectType,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })));
      }

      calculateAmounts();
    }
  };

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setProductItems([{ key: 0 }]);
    setExtraFees([]);
    setDiscountType('percentage');
    setAmounts({
      baseAmount: 0,
      discountAmount: 0,
      extraAmount: 0,
      finalAmount: 0
    });
    setSelectedClient(null);
  };

  // 处理客户选择
  const handleClientSelect = async (clientId) => {
    try {
      const res = await getClientDetail(clientId);
      if (res.code === 200) {
        setSelectedClient(res.data);
      }
    } catch (error) {
      console.error('获取客户详情失败:', error);
    }
  };

  // 添加产品行
  const addProductItem = () => {
    setProductItems([...productItems, { key: Date.now() }]);
  };

  // 删除产品行
  const removeProductItem = (key) => {
    if (productItems.length > 1) {
      setProductItems(productItems.filter(item => item.key !== key));
      setTimeout(calculateAmounts, 100);
    }
  };

  // 添加额外费用
  const addExtraFee = () => {
    setExtraFees([...extraFees, { key: Date.now(), name: '', amount: 0 }]);
  };

  // 删除额外费用
  const removeExtraFee = (key) => {
    setExtraFees(extraFees.filter(fee => fee.key !== key));
    setTimeout(calculateAmounts, 100);
  };

  // 计算金额
  const calculateAmounts = () => {
    const formValues = form.getFieldsValue();

    // 计算基础金额
    let baseAmount = 0;
    productItems.forEach((item, index) => {
      const quantity = formValues[`quantity_${item.key}`] || 0;
      const unitPrice = formValues[`unitPrice_${item.key}`] || 0;
      baseAmount += quantity * unitPrice;
    });

    // 计算折扣金额
    let discountAmount = 0;
    const discountValue = formValues.discountValue || 0;
    if (discountType === 'percentage') {
      discountAmount = baseAmount * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }

    // 计算额外费用
    let extraAmount = 0;
    extraFees.forEach((fee, index) => {
      const amount = formValues[`extraAmount_${fee.key}`] || 0;
      extraAmount += parseFloat(amount);
    });

    // 计算最终金额
    const finalAmount = baseAmount - discountAmount + extraAmount;

    setAmounts({
      baseAmount: baseAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      extraAmount: extraAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2)
    });
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 构建产品明细数据
      const items = productItems.map((item) => ({
        effectType: values[`effectType_${item.key}`],
        quantity: values[`quantity_${item.key}`],
        unitPrice: values[`unitPrice_${item.key}`]
      }));

      // 构建额外费用数据
      const extras = extraFees.map((fee) => ({
        name: values[`extraName_${fee.key}`],
        amount: values[`extraAmount_${fee.key}`]
      }));

      // 构建订单数据
      const orderData = {
        clientId: values.clientId,
        shootingType: values.shootingType,
        priority: values.priority || 3,
        remark: values.remark,
        items,
        extras,
        discountType,
        discountValue: values.discountValue || 0,
        baseAmount: amounts.baseAmount,
        discountAmount: amounts.discountAmount,
        extraAmount: amounts.extraAmount,
        finalAmount: amounts.finalAmount
      };

      let res;
      if (isEditMode) {
        res = await updateOrder(editData.orderId, orderData);
      } else {
        res = await createOrder(orderData);
      }

      if (res.code === 200 || res.code === 201) {
        message.success(isEditMode ? '订单更新成功' : '订单创建成功');
        onSuccess();
        handleCancel();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (error) {
      console.error('订单操作失败:', error);
      message.error('操作失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  // 获取效果类型价格范围
  const getEffectTypePriceRange = (effectTypeId) => {
    const type = effectTypes.find(t => t.id === effectTypeId);
    if (type) {
      return `¥${type.minPrice} - ¥${type.maxPrice}`;
    }
    return '';
  };

  // 产品明细列定义
  const productColumns = [
    {
      title: '效果类型',
      dataIndex: 'effectType',
      width: 150,
      render: (_, item, index) => (
        <Form.Item
          name={`effectType_${item.key}`}
          rules={[{ required: true, message: '请选择效果类型' }]}
          style={{ marginBottom: 0 }}
        >
          <Select
            placeholder="选择效果"
            onChange={() => calculateAmounts()}
          >
            {effectTypes.map(type => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 120,
      render: (_, item) => (
        <Form.Item
          name={`quantity_${item.key}`}
          rules={[
            { required: true, message: '请输入数量' },
            { type: 'number', min: 1, message: '数量必须大于0' }
          ]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber
            min={1}
            placeholder="数量"
            style={{ width: '100%' }}
            onChange={() => calculateAmounts()}
          />
        </Form.Item>
      )
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 150,
      render: (_, item) => {
        const effectTypeId = form.getFieldValue(`effectType_${item.key}`);
        const priceRange = getEffectTypePriceRange(effectTypeId);

        return (
          <Form.Item
            name={`unitPrice_${item.key}`}
            rules={[
              { required: true, message: '请输入单价' },
              { type: 'number', min: 0.01, message: '单价必须大于0' }
            ]}
            style={{ marginBottom: 0 }}
            help={priceRange}
          >
            <InputNumber
              min={0.01}
              precision={2}
              placeholder="单价"
              style={{ width: '100%' }}
              onChange={() => calculateAmounts()}
              addonBefore="¥"
            />
          </Form.Item>
        );
      }
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      width: 100,
      render: (_, item) => {
        const quantity = form.getFieldValue(`quantity_${item.key}`) || 0;
        const unitPrice = form.getFieldValue(`unitPrice_${item.key}`) || 0;
        const subtotal = quantity * unitPrice;
        return <span>¥{subtotal.toFixed(2)}</span>;
      }
    },
    {
      title: '操作',
      width: 80,
      render: (_, item) => (
        <Button
          type="link"
          danger
          icon={<MinusCircleOutlined />}
          onClick={() => removeProductItem(item.key)}
          disabled={productItems.length === 1}
        >
          删除
        </Button>
      )
    }
  ];

  return (
    <Modal
      title={isEditMode ? '编辑订单' : '创建订单'}
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={1000}
      confirmLoading={loading}
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={calculateAmounts}
      >
        {/* 基本信息 */}
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="clientId"
                label="客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select
                  showSearch
                  placeholder="选择客户"
                  onChange={handleClientSelect}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {clients.map(client => (
                    <Option key={client.clientId} value={client.clientId}>
                      {client.clientName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {selectedClient && (
                <div className="client-info">
                  <p>联系人：{selectedClient.contactPerson || '-'}</p>
                  <p>电话：{selectedClient.phone || '-'}</p>
                </div>
              )}
            </Col>

            <Col span={6}>
              <Form.Item
                name="shootingType"
                label="拍摄类型"
              >
                <Input placeholder="如：夏装、童装等" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="priority"
                label="优先级"
                initialValue={3}
              >
                <Select>
                  <Option value={1}>最高</Option>
                  <Option value={2}>高</Option>
                  <Option value={3}>普通</Option>
                  <Option value={4}>低</Option>
                  <Option value={5}>最低</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="remark"
                label="备注"
              >
                <TextArea rows={2} placeholder="订单备注信息" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 产品明细 */}
        <Card title="产品明细" size="small" style={{ marginBottom: 16 }}>
          <Table
            columns={productColumns}
            dataSource={productItems}
            pagination={false}
            rowKey="key"
            size="small"
          />
          <Button
            type="dashed"
            onClick={addProductItem}
            icon={<PlusOutlined />}
            style={{ marginTop: 16, width: '100%' }}
          >
            添加产品
          </Button>
        </Card>

        {/* 金额信息 */}
        <Card title="金额信息" size="small">
          <Row gutter={16}>
            <Col span={8}>
              <div className="amount-item">
                <span>基础金额：</span>
                <span className="amount-value">¥{amounts.baseAmount}</span>
              </div>
            </Col>

            <Col span={16}>
              <Form.Item label="折扣" style={{ marginBottom: 8 }}>
                <Space>
                  <Radio.Group
                    value={discountType}
                    onChange={(e) => {
                      setDiscountType(e.target.value);
                      setTimeout(calculateAmounts, 100);
                    }}
                  >
                    <Radio value="percentage">百分比</Radio>
                    <Radio value="fixed">固定金额</Radio>
                  </Radio.Group>

                  <Form.Item
                    name="discountValue"
                    noStyle
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      placeholder="折扣值"
                      addonAfter={discountType === 'percentage' ? '%' : '元'}
                      onChange={() => calculateAmounts()}
                    />
                  </Form.Item>

                  <span>折扣金额：¥{amounts.discountAmount}</span>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {extraFees.map((fee) => (
                <Space key={fee.key}>
                  <Form.Item
                    name={`extraName_${fee.key}`}
                    noStyle
                    rules={[{ required: true, message: '请输入费用名称' }]}
                  >
                    <Input placeholder="费用名称（如：加急费）" style={{ width: 200 }} />
                  </Form.Item>

                  <Form.Item
                    name={`extraAmount_${fee.key}`}
                    noStyle
                    rules={[{ required: true, message: '请输入金额' }]}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      placeholder="金额"
                      addonBefore="¥"
                      onChange={() => calculateAmounts()}
                    />
                  </Form.Item>

                  <Button
                    type="link"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => removeExtraFee(fee.key)}
                  >
                    删除
                  </Button>
                </Space>
              ))}

              <Button
                type="dashed"
                onClick={addExtraFee}
                icon={<PlusOutlined />}
                size="small"
              >
                添加额外费用
              </Button>

              {extraFees.length > 0 && (
                <div className="amount-item">
                  <span>额外费用合计：</span>
                  <span className="amount-value">¥{amounts.extraAmount}</span>
                </div>
              )}
            </Space>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div className="final-amount">
            <span>最终金额：</span>
            <span className="amount-value final">¥{amounts.finalAmount}</span>
          </div>
        </Card>
      </Form>
    </Modal>
  );
};

export default CreateOrderModal;
