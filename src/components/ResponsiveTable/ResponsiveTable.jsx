/**
 * 响应式表格组件
 * 桌面端显示表格，移动端显示卡片列表
 */

import React from 'react';
import { Table, Empty } from 'antd';
import { useDeviceType } from '@/utils/responsive';
import './ResponsiveTable.less';

function ResponsiveTable({
  columns,
  dataSource,
  loading,
  pagination,
  rowKey = 'id',
  onRow,
  renderMobileCard, // 自定义移动端卡片渲染函数
  mobileCardProps = {}, // 移动端卡片的额外props
  ...restProps
}) {
  const deviceType = useDeviceType();

  // 默认的移动端卡片渲染
  const defaultRenderMobileCard = (record) => {
    // 过滤掉操作列
    const displayColumns = columns.filter(col => col.key !== 'action' && !col.hideInMobile);

    // 查找操作列
    const actionColumn = columns.find(col => col.key === 'action');

    return (
      <div className="mobile-card-item" key={record[rowKey]}>
        <div className="card-header">
          {/* 显示第一个字段作为标题 */}
          <div className="card-title">
            {displayColumns[0] && displayColumns[0].render
              ? displayColumns[0].render(record[displayColumns[0].dataIndex], record)
              : record[displayColumns[0]?.dataIndex]}
          </div>
        </div>

        <div className="card-body">
          {/* 显示其他字段 */}
          {displayColumns.slice(1).map((col, index) => {
            const value = record[col.dataIndex];
            const displayValue = col.render ? col.render(value, record) : value;

            return (
              <div className="card-row" key={index}>
                <span className="label">{col.title}:</span>
                <span className="value">{displayValue || '-'}</span>
              </div>
            );
          })}
        </div>

        {/* 操作按钮 */}
        {actionColumn && (
          <div className="card-footer">
            {actionColumn.render ? actionColumn.render(null, record) : null}
          </div>
        )}
      </div>
    );
  };

  // 移动端渲染
  if (deviceType === 'mobile') {
    const renderFunc = renderMobileCard || defaultRenderMobileCard;

    return (
      <div className="responsive-table mobile-mode">
        {loading ? (
          <div className="loading-container">
            <Empty description="加载中..." />
          </div>
        ) : dataSource && dataSource.length > 0 ? (
          <div className="mobile-card-list" {...mobileCardProps}>
            {dataSource.map(record => renderFunc(record))}
          </div>
        ) : (
          <Empty description="暂无数据" />
        )}

        {/* 分页 */}
        {pagination && pagination.total > 0 && (
          <div className="mobile-pagination">
            {/* Ant Design的Pagination在移动端也是响应式的 */}
            <Table.Pagination {...pagination} />
          </div>
        )}
      </div>
    );
  }

  // 桌面端渲染
  return (
    <div className="responsive-table desktop-mode">
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        rowKey={rowKey}
        onRow={onRow}
        {...restProps}
      />
    </div>
  );
}

export default ResponsiveTable;
