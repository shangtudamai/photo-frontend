import React from 'react';
import { Card } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './FinancialChart.less';

/**
 * 财务概览图表组件
 */
const FinancialChart = ({ data, loading }) => {
  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ¥{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 格式化Y轴数值
  const formatYAxis = (value) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`;
    }
    return value;
  };

  return (
    <Card
      title="近7天营收趋势"
      className="financial-chart-card"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            name="营收"
            stroke="#1890ff"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="payment"
            name="实收"
            stroke="#52c41a"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="支出"
            stroke="#ff4d4f"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 统计摘要 */}
      {data && data.length > 0 && (
        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">总营收：</span>
            <span className="summary-value revenue">
              ¥{data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">总实收：</span>
            <span className="summary-value payment">
              ¥{data.reduce((sum, item) => sum + item.payment, 0).toLocaleString()}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">总支出：</span>
            <span className="summary-value expense">
              ¥{data.reduce((sum, item) => sum + item.expense, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FinancialChart;
