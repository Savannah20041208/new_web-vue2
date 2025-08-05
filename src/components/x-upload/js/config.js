<<<<<<< HEAD
/*export const ACCEPT_CONFIG = {
    image: ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    video: ['.mp4', '.rmvb', '.mkv', '.wmv', '.flv'],
    document: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.txt', '.tif', '.tiff'],
    getAll(){
        return [...this.image, ...this.video, ...this.document]
    },
};
*/
=======
// 上传组件配置管理
export const uploadConfig = {
  // 基础配置
  basic: {
    // 分片大小配置
    chunkSize: 5 * 1024 * 1024, // 5MB
    forceChunkSize: true,
    
    // 并发配置
    simultaneousUploads: 4,
    
    // 重试配置
    maxChunkRetries: 3,
    chunkRetryInterval: 1000,
    
    // 进度配置
    progressCallbacksInterval: 200,
    speedSmoothingFactor: 0.1,
  },

  // 网络配置
  network: {
    // 网络速度检测
    enableSpeedDetection: true,
    speedTestUrl: '/api/speed-test',
    
    // 网络状态监控
    enableNetworkMonitoring: true,
    
    // 自适应配置
    enableAdaptiveChunkSize: true,
    enableAdaptiveConcurrency: true,
  },

  // 性能配置
  performance: {
    // 内存管理
    enableMemoryManagement: true,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    memoryCleanupInterval: 5 * 60 * 1000, // 5分钟
    
    // 缓存配置
    enableChunkCache: true,
    cacheMaxAge: 5 * 60 * 1000, // 5分钟
    
    // 性能监控
    enablePerformanceMonitoring: true,
    performanceMetrics: {
      uploadSpeed: true,
      memoryUsage: true,
      chunkProgress: true,
      errorRate: true,
    },
  },

  // 错误处理配置
  errorHandling: {
    // 错误重试
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    
    // 错误报告
    enableErrorReporting: true,
    errorReportingUrl: '/api/error-report',
    
    // 错误分类
    errorTypes: {
      network: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
      server: ['500', '502', '503', '504'],
      client: ['400', '401', '403', '404'],
    },
  },

  // 安全配置
  security: {
    // 文件验证
    enableFileValidation: true,
    allowedFileTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    
    // 内容安全
    enableContentSecurity: true,
    validateFileContent: true,
    
    // 传输安全
    enableSecureUpload: true,
    useHttps: true,
  },

  // UI配置
  ui: {
    // 进度显示
    showProgress: true,
    progressType: 'percentage', // percentage, speed, both
    
    // 文件列表
    showFileList: true,
    fileListMaxHeight: 300,
    
    // 拖拽上传
    enableDragDrop: true,
    dragDropZone: '#upload-zone',
    
    // 主题配置
    theme: {
      primaryColor: '#409EFF',
      successColor: '#67C23A',
      errorColor: '#F56C6C',
      warningColor: '#E6A23C',
    },
  },

  // 调试配置
  debug: {
    enableLogging: false,
    logLevel: 'info', // debug, info, warn, error
    enablePerformanceLogging: false,
    enableNetworkLogging: false,
  },
};

// 配置验证器
export const configValidator = {
  validateBasicConfig(config) {
    const errors = [];
    
    if (config.chunkSize <= 0) {
      errors.push('chunkSize must be greater than 0');
    }
    
    if (config.simultaneousUploads <= 0) {
      errors.push('simultaneousUploads must be greater than 0');
    }
    
    if (config.maxChunkRetries < 0) {
      errors.push('maxChunkRetries must be non-negative');
    }
    
    return errors;
  },

  validateNetworkConfig(config) {
    const errors = [];
    
    if (config.enableSpeedDetection && !config.speedTestUrl) {
      errors.push('speedTestUrl is required when enableSpeedDetection is true');
    }
    
    return errors;
  },

  validatePerformanceConfig(config) {
    const errors = [];
    
    if (config.maxMemoryUsage <= 0) {
      errors.push('maxMemoryUsage must be greater than 0');
    }
    
    if (config.memoryCleanupInterval <= 0) {
      errors.push('memoryCleanupInterval must be greater than 0');
    }
    
    return errors;
  },

  validateSecurityConfig(config) {
    const errors = [];
    
    if (config.maxFileSize <= 0) {
      errors.push('maxFileSize must be greater than 0');
    }
    
    return errors;
  },

  validateAll(config) {
    const allErrors = [];
    
    allErrors.push(...this.validateBasicConfig(config.basic));
    allErrors.push(...this.validateNetworkConfig(config.network));
    allErrors.push(...this.validatePerformanceConfig(config.performance));
    allErrors.push(...this.validateSecurityConfig(config.security));
    
    return allErrors;
  },
};

// 配置合并器
export const configMerger = {
  mergeConfigs(defaultConfig, userConfig) {
    const merged = JSON.parse(JSON.stringify(defaultConfig));
    
    configMerger.mergeObject(merged, userConfig);
    
    return merged;
  },

  mergeObject(target, source) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {};
          }
          configMerger.mergeObject(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  },
};

// 配置管理器
export class ConfigManager {
  constructor(defaultConfig = uploadConfig) {
    this.defaultConfig = defaultConfig;
    this.currentConfig = JSON.parse(JSON.stringify(defaultConfig));
    this.validators = configValidator;
    this.merger = configMerger;
  }

  // 更新配置
  updateConfig(newConfig) {
    const errors = this.validators.validateAll(newConfig);
    
    if (errors.length > 0) {
      console.error('配置验证失败:', errors);
      return false;
    }
    
    this.currentConfig = this.merger.mergeConfigs(this.defaultConfig, newConfig);
    return true;
  }

  // 获取配置
  getConfig(path = '') {
    if (!path) {
      return this.currentConfig;
    }
    
    const keys = path.split('.');
    let config = this.currentConfig;
    
    for (const key of keys) {
      if (config && typeof config === 'object' && key in config) {
        config = config[key];
      } else {
        return undefined;
      }
    }
    
    return config;
  }

  // 设置配置
  setConfig(path, value) {
    const keys = path.split('.');
    let config = this.currentConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!config[key] || typeof config[key] !== 'object') {
        config[key] = {};
      }
      config = config[key];
    }
    
    config[keys[keys.length - 1]] = value;
  }

  // 重置配置
  resetConfig() {
    this.currentConfig = JSON.parse(JSON.stringify(this.defaultConfig));
  }

  // 验证配置
  validateConfig() {
    return this.validators.validateAll(this.currentConfig);
  }
}

// 导出默认配置管理器实例
// eslint-disable-next-line no-unused-vars
export const configManager = new ConfigManager();
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc
