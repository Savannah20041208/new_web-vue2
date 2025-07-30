// 性能监控工具
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      uploadSpeed: [],
      memoryUsage: [],
      chunkProgress: [],
      errorRate: [],
      networkLatency: [],
      retryCount: 0,
      totalChunks: 0,
      completedChunks: 0,
      failedChunks: 0,
    };
    
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.isMonitoring = false;
  }

  // 开始监控
  start() {
    this.isMonitoring = true;
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();
    console.log('性能监控已启动');
  }

  // 停止监控
  stop() {
    this.isMonitoring = false;
    console.log('性能监控已停止');
  }

  // 记录上传速度
  recordUploadSpeed(speed) {
    if (!this.isMonitoring) return;
    
    this.metrics.uploadSpeed.push({
      timestamp: Date.now(),
      value: speed,
    });
    
    // 保持最近100个数据点
    if (this.metrics.uploadSpeed.length > 100) {
      this.metrics.uploadSpeed.shift();
    }
  }

  // 记录内存使用
  recordMemoryUsage(usage) {
    if (!this.isMonitoring) return;
    
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      value: usage,
    });
    
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
  }

  // 记录分片进度
  recordChunkProgress(chunkId, progress) {
    if (!this.isMonitoring) return;
    
    this.metrics.chunkProgress.push({
      timestamp: Date.now(),
      chunkId,
      progress,
    });
    
    if (this.metrics.chunkProgress.length > 200) {
      this.metrics.chunkProgress.shift();
    }
  }

  // 记录错误
  recordError(error) {
    if (!this.isMonitoring) return;
    
    this.metrics.errorRate.push({
      timestamp: Date.now(),
      error: error.message || error,
      type: error.type || 'unknown',
    });
    
    if (this.metrics.errorRate.length > 50) {
      this.metrics.errorRate.shift();
    }
  }

  // 记录网络延迟
  recordNetworkLatency(latency) {
    if (!this.isMonitoring) return;
    
    this.metrics.networkLatency.push({
      timestamp: Date.now(),
      value: latency,
    });
    
    if (this.metrics.networkLatency.length > 100) {
      this.metrics.networkLatency.shift();
    }
  }

  // 更新分片统计
  updateChunkStats(total, completed, failed) {
    this.metrics.totalChunks = total;
    this.metrics.completedChunks = completed;
    this.metrics.failedChunks = failed;
  }

  // 增加重试计数
  incrementRetryCount() {
    this.metrics.retryCount++;
  }

  // 获取平均上传速度
  getAverageUploadSpeed() {
    if (this.metrics.uploadSpeed.length === 0) return 0;
    
    const sum = this.metrics.uploadSpeed.reduce((acc, item) => acc + item.value, 0);
    return sum / this.metrics.uploadSpeed.length;
  }

  // 获取当前上传速度
  getCurrentUploadSpeed() {
    if (this.metrics.uploadSpeed.length === 0) return 0;
    return this.metrics.uploadSpeed[this.metrics.uploadSpeed.length - 1].value;
  }

  // 获取平均内存使用
  getAverageMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return 0;
    
    const sum = this.metrics.memoryUsage.reduce((acc, item) => acc + item.value, 0);
    return sum / this.metrics.memoryUsage.length;
  }

  // 获取当前内存使用
  getCurrentMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return 0;
    return this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1].value;
  }

  // 获取错误率
  getErrorRate() {
    const totalChunks = this.metrics.totalChunks;
    if (totalChunks === 0) return 0;
    return (this.metrics.failedChunks / totalChunks) * 100;
  }

  // 获取平均网络延迟
  getAverageNetworkLatency() {
    if (this.metrics.networkLatency.length === 0) return 0;
    
    const sum = this.metrics.networkLatency.reduce((acc, item) => acc + item.value, 0);
    return sum / this.metrics.networkLatency.length;
  }

  // 获取上传进度
  getUploadProgress() {
    const totalChunks = this.metrics.totalChunks;
    if (totalChunks === 0) return 0;
    return (this.metrics.completedChunks / totalChunks) * 100;
  }

  // 获取运行时间
  getRunTime() {
    return Date.now() - this.startTime;
  }

  // 获取性能报告
  getPerformanceReport() {
    return {
      runTime: this.getRunTime(),
      averageUploadSpeed: this.getAverageUploadSpeed(),
      currentUploadSpeed: this.getCurrentUploadSpeed(),
      averageMemoryUsage: this.getAverageMemoryUsage(),
      currentMemoryUsage: this.getCurrentMemoryUsage(),
      errorRate: this.getErrorRate(),
      averageNetworkLatency: this.getAverageNetworkLatency(),
      uploadProgress: this.getUploadProgress(),
      retryCount: this.metrics.retryCount,
      totalChunks: this.metrics.totalChunks,
      completedChunks: this.metrics.completedChunks,
      failedChunks: this.metrics.failedChunks,
      metrics: this.metrics,
    };
  }

  // 导出性能数据
  exportData() {
    return {
      startTime: this.startTime,
      endTime: Date.now(),
      metrics: this.metrics,
      report: this.getPerformanceReport(),
    };
  }

  // 清理旧数据
  cleanup() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10分钟
    
    // 清理上传速度数据
    this.metrics.uploadSpeed = this.metrics.uploadSpeed.filter(
      item => now - item.timestamp < maxAge
    );
    
    // 清理内存使用数据
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
      item => now - item.timestamp < maxAge
    );
    
    // 清理分片进度数据
    this.metrics.chunkProgress = this.metrics.chunkProgress.filter(
      item => now - item.timestamp < maxAge
    );
    
    // 清理错误数据
    this.metrics.errorRate = this.metrics.errorRate.filter(
      item => now - item.timestamp < maxAge
    );
    
    // 清理网络延迟数据
    this.metrics.networkLatency = this.metrics.networkLatency.filter(
      item => now - item.timestamp < maxAge
    );
  }

  // 重置监控器
  reset() {
    this.metrics = {
      uploadSpeed: [],
      memoryUsage: [],
      chunkProgress: [],
      errorRate: [],
      networkLatency: [],
      retryCount: 0,
      totalChunks: 0,
      completedChunks: 0,
      failedChunks: 0,
    };
    
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();
  }
}

// 网络性能监控器
export class NetworkMonitor {
  constructor() {
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    this.networkInfo = {
      type: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false,
    };
    
    this.init();
  }

  init() {
    if (this.connection) {
      this.updateNetworkInfo();
      this.connection.addEventListener('change', () => {
        this.updateNetworkInfo();
      });
    }
  }

  updateNetworkInfo() {
    if (this.connection) {
      this.networkInfo = {
        type: this.connection.type || 'unknown',
        effectiveType: this.connection.effectiveType || 'unknown',
        downlink: this.connection.downlink || 0,
        rtt: this.connection.rtt || 0,
        saveData: this.connection.saveData || false,
      };
    }
  }

  getNetworkInfo() {
    return this.networkInfo;
  }

  getNetworkSpeed() {
    return this.networkInfo.downlink;
  }

  getNetworkLatency() {
    return this.networkInfo.rtt;
  }

  isSlowNetwork() {
    return this.networkInfo.effectiveType === '2g' || this.networkInfo.downlink < 1;
  }

  isFastNetwork() {
    return this.networkInfo.effectiveType === '4g' && this.networkInfo.downlink > 10;
  }
}

// 内存监控器
export class MemoryMonitor {
  constructor() {
    this.memoryInfo = {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };
  }

  updateMemoryInfo() {
    if (performance.memory) {
      this.memoryInfo = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }
  }

  getMemoryInfo() {
    this.updateMemoryInfo();
    return this.memoryInfo;
  }

  getMemoryUsage() {
    this.updateMemoryInfo();
    return this.memoryInfo.usedJSHeapSize;
  }

  getMemoryUsagePercentage() {
    this.updateMemoryInfo();
    if (this.memoryInfo.jsHeapSizeLimit === 0) return 0;
    return (this.memoryInfo.usedJSHeapSize / this.memoryInfo.jsHeapSizeLimit) * 100;
  }

  isMemoryLow() {
    return this.getMemoryUsagePercentage() > 80;
  }
}

// 性能优化建议器
export class PerformanceOptimizer {
  constructor(performanceMonitor, networkMonitor, memoryMonitor) {
    this.performanceMonitor = performanceMonitor;
    this.networkMonitor = networkMonitor;
    this.memoryMonitor = memoryMonitor;
  }

  getOptimizationSuggestions() {
    const suggestions = [];
    
    // 检查网络性能
    if (this.networkMonitor.isSlowNetwork()) {
      suggestions.push({
        type: 'network',
        priority: 'high',
        message: '检测到网络速度较慢，建议减小分片大小以提高上传成功率',
        action: 'reduceChunkSize',
      });
    }
    
    // 检查内存使用
    if (this.memoryMonitor.isMemoryLow()) {
      suggestions.push({
        type: 'memory',
        priority: 'high',
        message: '内存使用率较高，建议清理缓存或减少并发数',
        action: 'cleanupMemory',
      });
    }
    
    // 检查错误率
    const errorRate = this.performanceMonitor.getErrorRate();
    if (errorRate > 10) {
      suggestions.push({
        type: 'error',
        priority: 'medium',
        message: `错误率较高 (${errorRate.toFixed(1)}%)，建议检查网络连接或服务器状态`,
        action: 'checkNetwork',
      });
    }
    
    // 检查上传速度
    const currentSpeed = this.performanceMonitor.getCurrentUploadSpeed();
    const averageSpeed = this.performanceMonitor.getAverageUploadSpeed();
    if (currentSpeed < averageSpeed * 0.5) {
      suggestions.push({
        type: 'speed',
        priority: 'medium',
        message: '当前上传速度较慢，建议检查网络状态',
        action: 'checkSpeed',
      });
    }
    
    return suggestions;
  }

  getOptimalChunkSize() {
    const networkSpeed = this.networkMonitor.getNetworkSpeed();
    const memoryUsage = this.memoryMonitor.getMemoryUsagePercentage();
    
    // 根据网络速度和内存使用情况调整分片大小
    let optimalSize = 5 * 1024 * 1024; // 默认5MB
    
    if (networkSpeed < 1) {
      optimalSize = 1 * 1024 * 1024; // 1MB for slow network
    } else if (networkSpeed > 10) {
      optimalSize = 10 * 1024 * 1024; // 10MB for fast network
    }
    
    if (memoryUsage > 70) {
      optimalSize = Math.min(optimalSize, 2 * 1024 * 1024); // 限制内存使用
    }
    
    return optimalSize;
  }

  getOptimalConcurrency() {
    const networkSpeed = this.networkMonitor.getNetworkSpeed();
    const memoryUsage = this.memoryMonitor.getMemoryUsagePercentage();
    
    let concurrency = 4; // 默认并发数
    
    if (networkSpeed > 10) {
      concurrency = 8;
    } else if (networkSpeed < 1) {
      concurrency = 2;
    }
    
    if (memoryUsage > 70) {
      concurrency = Math.max(1, concurrency - 2);
    }
    
    return concurrency;
  }
}

// 导出默认实例
// eslint-disable-next-line no-unused-vars
export const performanceMonitor = new PerformanceMonitor();
// eslint-disable-next-line no-unused-vars
export const networkMonitor = new NetworkMonitor();
// eslint-disable-next-line no-unused-vars
export const memoryMonitor = new MemoryMonitor();
// eslint-disable-next-line no-unused-vars
export const performanceOptimizer = new PerformanceOptimizer(
  performanceMonitor,
  networkMonitor,
  memoryMonitor
); 