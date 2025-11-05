/**
 * 响应式断点常量
 * 与 Ant Design 保持一致
 */

export const BREAKPOINTS = {
  xs: 480,   // 手机竖屏
  sm: 576,   // 手机横屏
  md: 768,   // 平板竖屏
  lg: 992,   // 平板横屏/小型桌面
  xl: 1200,  // 桌面
  xxl: 1600  // 大型桌面
};

/**
 * 媒体查询字符串
 */
export const MEDIA_QUERIES = {
  xs: `(max-width: ${BREAKPOINTS.xs}px)`,
  sm: `(max-width: ${BREAKPOINTS.sm}px)`,
  md: `(max-width: ${BREAKPOINTS.md}px)`,
  lg: `(max-width: ${BREAKPOINTS.lg}px)`,
  xl: `(max-width: ${BREAKPOINTS.xl}px)`,

  // 范围查询
  mobile: `(max-width: ${BREAKPOINTS.sm}px)`,
  tablet: `(min-width: ${BREAKPOINTS.sm + 1}px) and (max-width: ${BREAKPOINTS.lg}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg + 1}px)`
};

/**
 * 检测是否为移动设备
 */
export const isMobile = () => {
  return window.innerWidth <= BREAKPOINTS.sm;
};

/**
 * 检测是否为平板设备
 */
export const isTablet = () => {
  return window.innerWidth > BREAKPOINTS.sm && window.innerWidth <= BREAKPOINTS.lg;
};

/**
 * 检测是否为桌面设备
 */
export const isDesktop = () => {
  return window.innerWidth > BREAKPOINTS.lg;
};

/**
 * 使用媒体查询的 React Hook
 */
import { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addListener(listener);

    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

/**
 * 使用断点的 React Hook
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('xl');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width <= BREAKPOINTS.xs) {
        setBreakpoint('xs');
      } else if (width <= BREAKPOINTS.sm) {
        setBreakpoint('sm');
      } else if (width <= BREAKPOINTS.md) {
        setBreakpoint('md');
      } else if (width <= BREAKPOINTS.lg) {
        setBreakpoint('lg');
      } else if (width <= BREAKPOINTS.xl) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('xxl');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

/**
 * 检测设备类型的 React Hook
 */
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      if (isMobile()) {
        setDeviceType('mobile');
      } else if (isTablet()) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};

/**
 * 获取触摸友好的尺寸
 */
export const getTouchFriendlySize = (size) => {
  return isMobile() ? Math.max(size, 48) : size;
};
