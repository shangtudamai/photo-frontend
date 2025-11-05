import React, { useState, useRef, useEffect } from 'react';
import { Card, Tooltip, Tag } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './ProjectGantt.less';

/**
 * 项目全局进度甘特图组件
 */
const ProjectGantt = ({ data, loading }) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const containerRef = useRef(null);

  // 生成日期范围
  const generateDateRange = (startDate, endDate) => {
    const dates = [];
    let current = dayjs(startDate);
    const end = dayjs(endDate);

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      dates.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }

    return dates;
  };

  // 获取数据的日期范围
  const getDataDateRange = () => {
    if (!data || data.length === 0) {
      return {
        start: dayjs().format('YYYY-MM-DD'),
        end: dayjs().add(30, 'day').format('YYYY-MM-DD')
      };
    }

    const allDates = data.flatMap(item => [
      dayjs(item.startDate),
      dayjs(item.endDate)
    ]);

    const minDate = dayjs.min(allDates);
    const maxDate = dayjs.max(allDates);

    return {
      start: minDate.subtract(2, 'day').format('YYYY-MM-DD'),
      end: maxDate.add(2, 'day').format('YYYY-MM-DD')
    };
  };

  const dateRange = getDataDateRange();
  const dates = generateDateRange(dateRange.start, dateRange.end);
  const dayWidth = 60; // 每天的宽度

  // 计算项目条的位置和宽度
  const calculateBarPosition = (item) => {
    const startIndex = dates.indexOf(dayjs(item.startDate).format('YYYY-MM-DD'));
    const endIndex = dates.indexOf(dayjs(item.endDate).format('YYYY-MM-DD'));

    if (startIndex === -1 || endIndex === -1) return null;

    return {
      left: startIndex * dayWidth,
      width: (endIndex - startIndex + 1) * dayWidth
    };
  };

  // 获取进度颜色
  const getProgressColor = (progress) => {
    if (progress >= 100) return '#52c41a';
    if (progress >= 50) return '#1890ff';
    return '#faad14';
  };

  // 获取订单状态
  const getOrderStatus = (status) => {
    const statusMap = {
      1: { text: '待确认', color: 'default' },
      2: { text: '进行中', color: 'processing' },
      3: { text: '待验收', color: 'warning' },
      4: { text: '已完成', color: 'success' },
      5: { text: '已取消', color: 'error' }
    };
    return statusMap[status] || statusMap[1];
  };

  // 左右滚动
  const scroll = (direction) => {
    const scrollAmount = dayWidth * 7; // 滚动一周
    const newOffset = direction === 'left'
      ? Math.max(0, scrollOffset - scrollAmount)
      : Math.min(dates.length * dayWidth - containerRef.current?.clientWidth || 0, scrollOffset + scrollAmount);

    setScrollOffset(newOffset);
  };

  // 今天的标记位置
  const todayIndex = dates.indexOf(dayjs().format('YYYY-MM-DD'));
  const todayPosition = todayIndex !== -1 ? todayIndex * dayWidth : -1;

  return (
    <Card
      title="项目全局进度甘特图"
      className="project-gantt-card"
      loading={loading}
      extra={
        <div className="gantt-controls">
          <LeftOutlined
            onClick={() => scroll('left')}
            className="scroll-btn"
          />
          <RightOutlined
            onClick={() => scroll('right')}
            className="scroll-btn"
          />
        </div>
      }
    >
      <div className="gantt-container" ref={containerRef}>
        {/* 时间轴 */}
        <div className="gantt-timeline" style={{ transform: `translateX(-${scrollOffset}px)` }}>
          <div className="timeline-header">
            {dates.map((date, index) => {
              const d = dayjs(date);
              const isWeekend = d.day() === 0 || d.day() === 6;
              const isToday = date === dayjs().format('YYYY-MM-DD');

              return (
                <div
                  key={date}
                  className={`timeline-date ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`}
                  style={{ width: dayWidth }}
                >
                  <div className="date-day">{d.format('DD')}</div>
                  <div className="date-weekday">{d.format('ddd')}</div>
                </div>
              );
            })}
          </div>

          {/* 今日标记线 */}
          {todayPosition !== -1 && (
            <div
              className="today-marker"
              style={{ left: todayPosition + dayWidth / 2 }}
            />
          )}

          {/* 项目条 */}
          <div className="gantt-bars">
            {data && data.map((item, index) => {
              const position = calculateBarPosition(item);
              if (!position) return null;

              const status = getOrderStatus(item.orderStatus);
              const progressColor = getProgressColor(item.progress || 0);

              return (
                <div
                  key={item.orderId || index}
                  className="gantt-row"
                  style={{ height: 50 }}
                >
                  <div className="gantt-row-label">
                    <div className="order-info">
                      <span className="order-no">{item.orderNo}</span>
                      <Tag color={status.color} size="small">
                        {status.text}
                      </Tag>
                    </div>
                    <div className="client-name">{item.clientName}</div>
                  </div>
                  <Tooltip
                    title={
                      <div>
                        <div>订单：{item.orderNo}</div>
                        <div>客户：{item.clientName}</div>
                        <div>开始：{dayjs(item.startDate).format('YYYY-MM-DD')}</div>
                        <div>结束：{dayjs(item.endDate).format('YYYY-MM-DD')}</div>
                        <div>进度：{item.progress || 0}%</div>
                        <div>件数：{item.completedPieces || 0}/{item.totalPieces || 0}</div>
                      </div>
                    }
                  >
                    <div
                      className="gantt-bar"
                      style={{
                        left: position.left,
                        width: position.width,
                        backgroundColor: progressColor
                      }}
                    >
                      <div
                        className="gantt-bar-progress"
                        style={{
                          width: `${item.progress || 0}%`,
                          backgroundColor: progressColor,
                          opacity: 0.8
                        }}
                      />
                      <span className="gantt-bar-text">
                        {item.progress || 0}%
                      </span>
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectGantt;
