// 错误处理工具
// eslint-disable-next-line no-unused-vars
export class ErrorHandler {
  constructor() {
    this.errorTypes = {
      NETWORK: 'network',
      SERVER: 'server',
      CLIENT: 'client',
      VALIDATION: 'validation',
      TIMEOUT: 'timeout',
      UNKNOWN: 'unknown',
    };
    
    this.errorMessages = {
      [this.errorTypes.NETWORK]: {
        ECONNRESET: '网络连接被重置',
        ETIMEDOUT: '网络请求超时',
        ENOTFOUND: '无法连接到服务器',
        default: '网络连接错误',
      },
      [this.errorTypes.SERVER]: {
        '500': '服务器内部错误',
        '502': '网关错误',
        '503': '服务不可用',
        '504': '网关超时',
        default: '服务器错误',
      },
      [this.errorTypes.CLIENT]: {
        '400': '请求参数错误',
        '401': '未授权访问',
        '403': '禁止访问',
        '404': '资源不存在',
        default: '客户端错误',
      },
      [this.errorTypes.VALIDATION]: {
        FILE_TOO_LARGE: '文件大小超出限制',
        INVALID_FILE_TYPE: '不支持的文件类型',
        INVALID_FILE_NAME: '文件名包含非法字符',
        default: '文件验证失败',
      },
      [this.errorTypes.TIMEOUT]: {
        UPLOAD_TIMEOUT: '上传超时',
        CHUNK_TIMEOUT: '分片上传超时',
        default: '操作超时',
      },
      [this.errorTypes.UNKNOWN]: {
        default: '未知错误',
      },
    };
    
    this.errorCallbacks = new Map();
    this.errorHistory = [];
    this.maxErrorHistory = 100;
  }

  // 注册错误回调
  registerErrorCallback(errorType, callback) {
    if (!this.errorCallbacks.has(errorType)) {
      this.errorCallbacks.set(errorType, []);
    }
    this.errorCallbacks.get(errorType).push(callback);
  }

  // 移除错误回调
  // eslint-disable-next-line no-unused-vars
  removeErrorCallback(errorType, callback) {
    if (this.errorCallbacks.has(errorType)) {
      const callbacks = this.errorCallbacks.get(errorType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 处理错误
  handleError(error, context = {}) {
    const errorInfo = this.analyzeError(error);
    const errorMessage = this.getErrorMessage(errorInfo);
    
    // 记录错误历史
    this.recordError({
      ...errorInfo,
      message: errorMessage,
      context,
      timestamp: Date.now(),
    });
    
    // 触发错误回调
    this.triggerErrorCallbacks(errorInfo.type, errorInfo, context);
    
    // 返回错误信息
    return {
      type: errorInfo.type,
      code: errorInfo.code,
      message: errorMessage,
      originalError: error,
      context,
    };
  }

  // 分析错误
  analyzeError(error) {
    let type = this.errorTypes.UNKNOWN;
    let code = 'UNKNOWN_ERROR';
    
    // 分析网络错误
    if (error.code && this.isNetworkError(error.code)) {
      type = this.errorTypes.NETWORK;
      code = error.code;
    }
    // 分析HTTP状态码
    else if (error.status) {
      if (error.status >= 500) {
        type = this.errorTypes.SERVER;
      } else if (error.status >= 400) {
        type = this.errorTypes.CLIENT;
      }
      code = error.status.toString();
    }
    // 分析超时错误
    else if (error.message && error.message.includes('timeout')) {
      type = this.errorTypes.TIMEOUT;
      code = 'UPLOAD_TIMEOUT';
    }
    // 分析验证错误
    else if (error.type === 'validation') {
      type = this.errorTypes.VALIDATION;
      code = error.code || 'VALIDATION_ERROR';
    }
    
    return { type, code, originalError: error };
  }

  // 判断是否为网络错误
  isNetworkError(code) {
    const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
    return networkErrors.includes(code);
  }

  // 获取错误消息
  getErrorMessage(errorInfo) {
    const { type, code } = errorInfo;
    const typeMessages = this.errorMessages[type];
    
    if (typeMessages && typeMessages[code]) {
      return typeMessages[code];
    }
    
    if (typeMessages && typeMessages.default) {
      return typeMessages.default;
    }
    
    return this.errorMessages[this.errorTypes.UNKNOWN].default;
  }

  // 记录错误
  recordError(errorInfo) {
    this.errorHistory.push(errorInfo);
    
    // 限制错误历史记录数量
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }
  }

  // 触发错误回调
  triggerErrorCallbacks(errorType, errorInfo, context) {
    if (this.errorCallbacks.has(errorType)) {
      const callbacks = this.errorCallbacks.get(errorType);
      callbacks.forEach(callback => {
        try {
          callback(errorInfo, context);
        } catch (callbackError) {
          console.error('错误回调执行失败:', callbackError);
        }
      });
    }
    
    // 触发通用错误回调
    if (this.errorCallbacks.has('*')) {
      const callbacks = this.errorCallbacks.get('*');
      callbacks.forEach(callback => {
        try {
          callback(errorInfo, context);
        } catch (callbackError) {
          console.error('通用错误回调执行失败:', callbackError);
        }
      });
    }
  }

  // 获取错误历史
  // eslint-disable-next-line no-unused-vars
  getErrorHistory() {
    return [...this.errorHistory];
  }

  // 获取错误统计
  // eslint-disable-next-line no-unused-vars
  getErrorStats() {
    const stats = {};
    
    this.errorHistory.forEach(error => {
      if (!stats[error.type]) {
        stats[error.type] = {};
      }
      if (!stats[error.type][error.code]) {
        stats[error.type][error.code] = 0;
      }
      stats[error.type][error.code]++;
    });
    
    return stats;
  }

  // 清理错误历史
  // eslint-disable-next-line no-unused-vars
  clearErrorHistory() {
    this.errorHistory = [];
  }

  // 创建自定义错误
  // eslint-disable-next-line no-unused-vars
  createError(type, code, message, originalError = null) {
    return {
      type,
      code,
      message,
      originalError,
      isCustomError: true,
    };
  }

  // 验证错误是否可重试
  // eslint-disable-next-line no-unused-vars
  isRetryableError(error) {
    const retryableErrors = [
      this.errorTypes.NETWORK,
      this.errorTypes.TIMEOUT,
    ];
    
    const retryableCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'UPLOAD_TIMEOUT',
      'CHUNK_TIMEOUT',
    ];
    
    const errorInfo = this.analyzeError(error);
    
    return retryableErrors.includes(errorInfo.type) || 
           retryableCodes.includes(errorInfo.code);
  }

  // 获取重试建议
  // eslint-disable-next-line no-unused-vars
  getRetrySuggestion(error) {
    const errorInfo = this.analyzeError(error);
    
    switch (errorInfo.type) {
      case this.errorTypes.NETWORK:
        return {
          shouldRetry: true,
          retryDelay: 2000,
          maxRetries: 3,
          message: '网络连接错误，建议稍后重试',
        };
      case this.errorTypes.TIMEOUT:
        return {
          shouldRetry: true,
          retryDelay: 1000,
          maxRetries: 2,
          message: '上传超时，建议重试',
        };
      case this.errorTypes.SERVER:
        return {
          shouldRetry: true,
          retryDelay: 5000,
          maxRetries: 2,
          message: '服务器错误，建议稍后重试',
        };
      default:
        return {
          shouldRetry: false,
          message: '此错误不可重试',
        };
    }
  }
}

// 文件验证器
// eslint-disable-next-line no-unused-vars
export class FileValidator {
  constructor(config = {}) {
    this.config = {
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      allowedFileTypes: ['*/*'],
      maxFileNameLength: 255,
      forbiddenCharacters: ['<', '>', ':', '"', '|', '?', '*', '\\', '/'],
      ...config,
    };
  }

  // 验证文件
  // eslint-disable-next-line no-unused-vars
  validateFile(file) {
    const errors = [];
    
    // 验证文件大小
    if (file.size > this.config.maxFileSize) {
      errors.push({
        type: 'validation',
        code: 'FILE_TOO_LARGE',
        message: `文件大小超出限制 (${this.formatFileSize(file.size)} > ${this.formatFileSize(this.config.maxFileSize)})`,
      });
    }
    
    // 验证文件类型
    if (!this.isAllowedFileType(file.type)) {
      errors.push({
        type: 'validation',
        code: 'INVALID_FILE_TYPE',
        message: `不支持的文件类型: ${file.type}`,
      });
    }
    
    // 验证文件名
    if (!this.isValidFileName(file.name)) {
      errors.push({
        type: 'validation',
        code: 'INVALID_FILE_NAME',
        message: '文件名包含非法字符',
      });
    }
    
    // 验证文件名长度
    if (file.name.length > this.config.maxFileNameLength) {
      errors.push({
        type: 'validation',
        code: 'FILE_NAME_TOO_LONG',
        message: `文件名过长 (${file.name.length} > ${this.config.maxFileNameLength})`,
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 检查文件类型是否允许
  // eslint-disable-next-line no-unused-vars
  isAllowedFileType(fileType) {
    if (this.config.allowedFileTypes.includes('*/*')) {
      return true;
    }
    
    return this.config.allowedFileTypes.some(allowedType => {
      if (allowedType.endsWith('/*')) {
        const baseType = allowedType.slice(0, -2);
        return fileType.startsWith(baseType);
      }
      return fileType === allowedType;
    });
  }

  // 检查文件名是否有效
  // eslint-disable-next-line no-unused-vars
  isValidFileName(fileName) {
    return !this.config.forbiddenCharacters.some(char => 
      fileName.includes(char)
    );
  }

  // 格式化文件大小
  // eslint-disable-next-line no-unused-vars
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 更新配置
  // eslint-disable-next-line no-unused-vars
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// 错误报告器
// eslint-disable-next-line no-unused-vars
export class ErrorReporter {
  constructor(config = {}) {
    this.config = {
      enableReporting: true,
      reportUrl: '/api/error-report',
      reportInterval: 60000, // 1分钟
      maxReportSize: 10,
      ...config,
    };
    
    this.pendingReports = [];
    this.lastReportTime = 0;
  }

  // 报告错误
  // eslint-disable-next-line no-unused-vars
  async reportError(error, context = {}) {
    if (!this.config.enableReporting) {
      return;
    }
    
    const report = {
      timestamp: Date.now(),
      error: {
        type: error.type,
        code: error.code,
        message: error.message,
        stack: error.originalError?.stack,
      },
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context,
      },
    };
    
    this.pendingReports.push(report);
    
    // 检查是否需要立即报告
    if (this.shouldReportNow()) {
      await this.sendReports();
    }
  }

  // 检查是否应该立即报告
  // eslint-disable-next-line no-unused-vars
  shouldReportNow() {
    const now = Date.now();
    const timeSinceLastReport = now - this.lastReportTime;
    
    return this.pendingReports.length >= this.config.maxReportSize ||
           timeSinceLastReport >= this.config.reportInterval;
  }

  // 发送错误报告
  // eslint-disable-next-line no-unused-vars
  async sendReports() {
    if (this.pendingReports.length === 0) {
      return;
    }
    
    const reports = [...this.pendingReports];
    this.pendingReports = [];
    this.lastReportTime = Date.now();
    
    try {
      const response = await fetch(this.config.reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reports }),
      });
      
      if (!response.ok) {
        console.warn('错误报告发送失败:', response.status);
        // 将报告重新加入队列
        this.pendingReports.unshift(...reports);
      }
    } catch (error) {
      console.error('发送错误报告时发生错误:', error);
      // 将报告重新加入队列
      this.pendingReports.unshift(...reports);
    }
  }

  // 强制发送所有待发送的报告
  // eslint-disable-next-line no-unused-vars
  async flushReports() {
    await this.sendReports();
  }
}

// 导出默认实例
// eslint-disable-next-line no-unused-vars
export const errorHandler = new ErrorHandler();
// eslint-disable-next-line no-unused-vars
export const fileValidator = new FileValidator();
// eslint-disable-next-line no-unused-vars
export const errorReporter = new ErrorReporter(); 