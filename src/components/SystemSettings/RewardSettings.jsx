/**
 * 奖罚参数配置表单
 */

import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Space, message, Modal, Table, Input } from 'antd';
import { SaveOutlined, UndoOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { batchUpdateParameters, resetToDefaults } from '@/services/settingService';

const { confirm } = Modal;

function RewardSettings({ parameters, onUpdateSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [completionRewards, setCompletionRewards] = useState([]);
  const [delayPenalties, setDelayPenalties] = useState([]);
  const [qualityWeights, setQualityWeights] = useState([]);

  // 初始化表单值
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const initialValues = {};

      parameters.forEach(param => {
        const key = param.parameterKey;
        let value = param.parameterValue;

        if (key === 'completion_reward_tiers') {
          // 转换为表格数据
          const rewards = Object.keys(value).map(threshold => ({
            key: threshold,
            threshold: parseInt(threshold),
            score: value[threshold].score,
            description: value[threshold].description
          }));
          setCompletionRewards(rewards);
        } else if (key === 'delay_penalty_tiers') {
          // 转换为表格数据
          const penalties = Object.keys(value).map(days => ({
            key: days,
            days: parseInt(days),
            score: value[days].score,
            description: value[days].description
          }));
          setDelayPenalties(penalties);
        } else if (key === 'quality_score_weights') {
          // 转换为表格数据
          const weights = Object.keys(value).map(level => ({
            key: level,
            level,
            score: value[level]
          }));
          setQualityWeights(weights);
        } else {
          initialValues[key] = value;
        }
      });

      form.setFieldsValue(initialValues);
    }
  }, [parameters, form]);

  // 保存配置
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      // 构建参数数组
      const updateParams = [];

      // 完成率奖励阶梯（转换为JSON）
      if (completionRewards.length > 0) {
        const rewardTiers = {};
        completionRewards.forEach(reward => {
          rewardTiers[reward.threshold] = {
            score: reward.score,
            description: reward.description
          };
        });

        updateParams.push({
          parameterKey: 'completion_reward_tiers',
          parameterValue: rewardTiers,
          changeReason: '更新完成率奖励阶梯'
        });
      }

      // 延迟处罚阶梯（转换为JSON）
      if (delayPenalties.length > 0) {
        const penaltyTiers = {};
        delayPenalties.forEach(penalty => {
          penaltyTiers[penalty.days] = {
            score: penalty.score,
            description: penalty.description
          };
        });

        updateParams.push({
          parameterKey: 'delay_penalty_tiers',
          parameterValue: penaltyTiers,
          changeReason: '更新延迟处罚阶梯'
        });
      }

      // 质量评分权重（转换为JSON）
      if (qualityWeights.length > 0) {
        const weights = {};
        qualityWeights.forEach(weight => {
          weights[weight.level] = weight.score;
        });

        updateParams.push({
          parameterKey: 'quality_score_weights',
          parameterValue: weights,
          changeReason: '更新质量评分权重'
        });
      }

      // 月度绩效奖金基数
      if (values.monthly_bonus_base !== undefined) {
        updateParams.push({
          parameterKey: 'monthly_bonus_base',
          parameterValue: values.monthly_bonus_base,
          changeReason: '更新月度绩效奖金基数'
        });
      }

      // 调用批量更新接口
      const res = await batchUpdateParameters(updateParams);

      if (res.code === 200) {
        message.success('奖罚参数保存成功');
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (error) {
      console.error('Error saving reward settings:', error);
      if (error.errorFields) {
        message.error('请检查表单填写');
      } else {
        message.error('保存失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 恢复默认值
  const handleReset = () => {
    confirm({
      title: '确认恢复默认值？',
      content: '此操作将恢复所有奖罚参数为系统默认值，是否继续？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await resetToDefaults('reward');

          if (res.code === 200) {
            message.success('已恢复默认值');
            if (onUpdateSuccess) {
              onUpdateSuccess();
            }
          } else {
            message.error(res.message || '恢复默认值失败');
          }
        } catch (error) {
          console.error('Error resetting reward settings:', error);
          message.error('恢复默认值失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 完成率奖励表格列
  const rewardColumns = [
    {
      title: '完成率阈值（%）',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (text, record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => {
            const newData = [...completionRewards];
            newData[index].threshold = value;
            setCompletionRewards(newData);
          }}
          min={100}
          max={200}
        />
      )
    },
    {
      title: '奖励分数',
      dataIndex: 'score',
      key: 'score',
      render: (text, record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => {
            const newData = [...completionRewards];
            newData[index].score = value;
            setCompletionRewards(newData);
          }}
        />
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => {
            const newData = [...completionRewards];
            newData[index].description = e.target.value;
            setCompletionRewards(newData);
          }}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record, index) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => {
            const newData = completionRewards.filter((_, i) => i !== index);
            setCompletionRewards(newData);
          }}
        >
          删除
        </Button>
      )
    }
  ];

  // 延迟处罚表格列
  const penaltyColumns = [
    {
      title: '延迟天数',
      dataIndex: 'days',
      key: 'days',
      render: (text, record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => {
            const newData = [...delayPenalties];
            newData[index].days = value;
            setDelayPenalties(newData);
          }}
          min={1}
        />
      )
    },
    {
      title: '扣分',
      dataIndex: 'score',
      key: 'score',
      render: (text, record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => {
            const newData = [...delayPenalties];
            newData[index].score = value;
            setDelayPenalties(newData);
          }}
        />
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => {
            const newData = [...delayPenalties];
            newData[index].description = e.target.value;
            setDelayPenalties(newData);
          }}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record, index) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => {
            const newData = delayPenalties.filter((_, i) => i !== index);
            setDelayPenalties(newData);
          }}
        >
          删除
        </Button>
      )
    }
  ];

  // 质量评分权重表格列
  const qualityColumns = [
    {
      title: '质量等级',
      dataIndex: 'level',
      key: 'level'
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      render: (text, record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => {
            const newData = [...qualityWeights];
            newData[index].score = value;
            setQualityWeights(newData);
          }}
        />
      )
    }
  ];

  return (
    <div className="parameter-form-container">
      <Form
        form={form}
        layout="vertical"
        className="parameter-form"
      >
        {/* 完成率奖励阶梯 */}
        <div className="form-section">
          <h3>完成率奖励阶梯</h3>
          <p className="section-desc">根据任务完成率给予不同的奖励分数</p>
          <Table
            dataSource={completionRewards}
            columns={rewardColumns}
            pagination={false}
            size="small"
          />
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => {
              setCompletionRewards([
                ...completionRewards,
                {
                  key: Date.now().toString(),
                  threshold: 100,
                  score: 5,
                  description: ''
                }
              ]);
            }}
            style={{ marginTop: 16 }}
          >
            添加奖励阶梯
          </Button>
        </div>

        {/* 延迟处罚阶梯 */}
        <div className="form-section">
          <h3>延迟处罚阶梯</h3>
          <p className="section-desc">根据任务延迟天数进行扣分</p>
          <Table
            dataSource={delayPenalties}
            columns={penaltyColumns}
            pagination={false}
            size="small"
          />
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => {
              setDelayPenalties([
                ...delayPenalties,
                {
                  key: Date.now().toString(),
                  days: 1,
                  score: -3,
                  description: ''
                }
              ]);
            }}
            style={{ marginTop: 16 }}
          >
            添加处罚阶梯
          </Button>
        </div>

        {/* 质量评分权重 */}
        <div className="form-section">
          <h3>质量评分权重</h3>
          <p className="section-desc">不同质量等级对应的分数</p>
          <Table
            dataSource={qualityWeights}
            columns={qualityColumns}
            pagination={false}
            size="small"
          />
        </div>

        {/* 月度绩效奖金基数 */}
        <Form.Item
          label="月度绩效奖金基数"
          name="monthly_bonus_base"
          extra="员工月度绩效奖金的基数（元）"
          rules={[
            { required: true, message: '请输入月度绩效奖金基数' },
            { type: 'number', min: 0, message: '奖金基数不能小于0' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonBefore="¥"
          />
        </Form.Item>

        {/* 操作按钮 */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={loading}
            >
              保存配置
            </Button>
            <Button
              icon={<UndoOutlined />}
              onClick={handleReset}
              loading={loading}
            >
              恢复默认
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

export default RewardSettings;
