// Performance monitoring utilities

export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
};

export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Prefetch data for faster navigation
export const prefetchData = async (fetchFunctions) => {
  try {
    await Promise.all(fetchFunctions.map(fn => fn()));
  } catch (error) {
    console.error('Prefetch failed:', error);
  }
};

// Check if user is on slow connection
export const isSlowConnection = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' ||
           connection.saveData;
  }
  return false;
};

// Lazy load images
export const lazyLoadImage = (src, placeholder = '') => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
    img.onerror = reject;
  });
};

export default {
  measurePerformance,
  debounce,
  throttle,
  prefetchData,
  isSlowConnection,
  lazyLoadImage,
};
