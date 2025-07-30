export const chunk = {
  data() {
    return {
      STATUS: {
        PENDING: "pending", // 待处理状态
        UPLOADING: "uploading", // 上传中状态
        READING: "reading", // 读取中状态
        SUCCESS: "success", // 成功状态
        ERROR: "error", // 错误状态
        COMPLETE: "complete", // 完成状态
        PROGRESS: "progress", // 进度状态
        RETRY: "retry", // 重试状态
      },
      // 添加缓存机制
      chunkCache: new Map(),
      // 添加内存管理
      memoryUsage: 0,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    };
  },
  methods: { 
    // 创建新的分片对象 - 优化版本
    newChunk(file, offset) {
      // 检查缓存中是否已存在
      const cacheKey = `${file.uniqueIdentifier}_${offset}`;
      if (this.chunkCache.has(cacheKey)) {
        return this.chunkCache.get(cacheKey);
      }

      // 创建一个空对象作为新的分片
      const chunk = Object.create(null);

      // 使用WeakMap来避免内存泄漏
      const privateProps = new WeakMap();
      privateProps.set(chunk, {
        file: file,
        bytes: null
      });

      // 定义不可枚举的属性
      this.defineNonEnumerable(chunk, "file", file);
      this.defineNonEnumerable(chunk, "bytes", null);
      this.defineNonEnumerable(chunk, "privateProps", privateProps);

      chunk.offset = offset;
      chunk.tested = false;
      chunk.initask = false;
      chunk.retries = 0;
      chunk.pendingRetry = false;
      chunk.preprocessState = 0;
      chunk.readState = 0;
      chunk.loaded = 0;
      chunk.total = 0;
      chunk.chunkSize = this.opts.chunkSize;
      chunk.startByte = chunk.offset * chunk.chunkSize;
      chunk.endByte = this.computeEndByte(chunk);
      chunk.xhr = null;
      chunk.createdAt = Date.now(); // 添加创建时间戳

      // 优化方法绑定，使用箭头函数避免this绑定问题
      chunk.status = () => this.status(chunk);
      chunk.send = () => this.send(chunk);
      chunk.readFinished = (bytes) => {
        chunk.readState = 2;
        chunk.bytes = bytes;
        // 添加内存使用监控
        this.updateMemoryUsage(bytes ? bytes.size : 0);
        chunk.send();
      };
      chunk.message = () => this.message(chunk);
      chunk.getParams = () => this.getParams(chunk);
      chunk.abort = () => this._abort(chunk);
      chunk._progress = () => this._progress(chunk);
      chunk._sizeUploaded = () => this._sizeUploaded(chunk);

      // 添加到缓存
      this.chunkCache.set(cacheKey, chunk);

      return chunk;
    },

    // 内存管理方法
    updateMemoryUsage(bytes) {
      this.memoryUsage += bytes;
      if (this.memoryUsage > this.maxMemoryUsage) {
        this.cleanupMemory();
      }
    },

    cleanupMemory() {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5分钟

      for (const [key, chunk] of this.chunkCache.entries()) {
        if (now - chunk.createdAt > maxAge) {
          this.chunkCache.delete(key);
          this.memoryUsage -= chunk.bytes ? chunk.bytes.size : 0;
        }
      }
    },

    // 计算分片的结束字节 - 优化版本
    computeEndByte(chunk) {
      const fileSize = chunk.file.size;
      const theoreticalEnd = (chunk.offset + 1) * chunk.chunkSize;
      
      // 使用Math.min优化性能
      let endByte = Math.min(fileSize, theoreticalEnd);
      
      // 优化条件判断
      if (fileSize - endByte < chunk.chunkSize && !this.opts.forceChunkSize) {
        endByte = fileSize;
      }
      
      return endByte;
    },

    /**
     * 检查分片的状态 - 优化版本
     * @param {Object} chunk - 要检查状态的分片对象
     * @param {boolean} [isTest=false] - 是否为测试模式
     * @returns {string} - 分片的状态
     */
    status(chunk, isTest = false) {
      // 使用早期返回模式优化性能
      if (chunk.readState === 1) {
        return this.STATUS.READING;
      }
      
      if (chunk.pendingRetry || chunk.preprocessState === 1) {
        return this.STATUS.UPLOADING;
      }
      
      if (!chunk.xhr) {
        return this.STATUS.PENDING;
      }
      
      if (chunk.xhr.readyState < 4 || chunk.processingResponse) {
        return this.STATUS.UPLOADING;
      }

      // 优化状态检查逻辑
      const status = this.determineChunkStatus(chunk, isTest);
      
      // 检查处理状态错误
      if (chunk.processedState?.err) {
        return this.STATUS.ERROR;
      }
      
      return status;
    },

    // 新增：确定分片状态的方法
    determineChunkStatus(chunk, isTest) {
      const xhr = chunk.xhr;
      const responseText = xhr.responseText;
      
      // 检查HTTP状态码
      const isSuccessStatus = this.opts.successStatuses.includes(xhr.status);
      const hasSuccessCode = !this.opts.successApiStatuses.code || 
                           responseText.includes(this.opts.successApiStatuses.code);
      const hasSuccessState = !this.opts.successApiStatuses.state || 
                            responseText.includes(this.opts.successApiStatuses.state);
      
      if (isSuccessStatus && hasSuccessCode && hasSuccessState) {
        return this.STATUS.SUCCESS;
      }
      
      // 检查永久错误
      const isPermanentError = this.opts.permanentErrors.includes(xhr.status) ||
                              (!isTest && chunk.retries >= this.opts.maxChunkRetries);
      
      if (isPermanentError) {
        return this.STATUS.ERROR;
      }
      
      // 重置并重试
      chunk.abort();
      return this.STATUS.PENDING;
    },

    // 获取分片参数 - 优化版本
    getParams(chunk) {
      const params = {
        chunkNumber: chunk.offset + 1,
        chunkSize: this.opts.chunkSize,
        currentChunkSize: chunk.endByte - chunk.startByte,
        totalSize: chunk.file.size,
        identifier: chunk.file.uniqueIdentifier,
        filename: chunk.file.name,
        relativePath: chunk.file.relativePath,
        totalChunks: chunk.file.chunks.length,
      };

      // 添加性能监控参数
      if (this.opts.enablePerformanceMonitoring) {
        params.uploadStartTime = chunk.createdAt;
        params.memoryUsage = this.memoryUsage;
      }

      return params;
    },

    // 发送分片的函数 - 优化版本
    async send(chunk) {
      try {
        // 预处理检查
        if (this.isFunction(this.opts.preprocess)) {
          const preprocessResult = await this.handlePreprocess(chunk);
          if (preprocessResult === 'continue') {
            // 继续处理
          } else {
            return; // 预处理未完成
          }
        }

        // 读取状态处理
        if (chunk.readState === 0) {
          chunk.readState = 1;
          const bytes = await this.readChunkBytes(chunk);
          chunk.readFinished(bytes);
          return;
        }

        if (chunk.readState === 1) {
          return; // 正在读取
        }

        // 测试分片
        if (this.opts.testChunks && !chunk.tested) {
          await this.test(chunk);
          return;
        }

        // 重置状态
        this.resetChunkState(chunk);

        // 创建并发送请求
        await this.createAndSendRequest(chunk);

      } catch (error) {
        console.error('发送分片时发生错误:', error);
        this.handleChunkError(chunk, error);
      }
    },

    // 新增：处理预处理
    async handlePreprocess(chunk) {
      switch (chunk.preprocessState) {
        case 0:
          chunk.preprocessState = 1;
          try {
            await this.opts.preprocess(chunk);
            return 'continue';
          } catch (error) {
            console.error('预处理失败:', error);
            return 'error';
          }
        case 1:
          return 'waiting';
        default:
          return 'continue';
      }
    },

    // 新增：读取分片字节
    async readChunkBytes(chunk) {
      return new Promise((resolve, reject) => {
        try {
          const bytes = chunk.file.file[this.sliceName](
            chunk.startByte,
            chunk.endByte,
            chunk.file.fileType,
          );
          resolve(bytes);
        } catch (error) {
          reject(error);
        }
      });
    },

    // 新增：重置分片状态
    resetChunkState(chunk) {
      chunk.loaded = 0;
      chunk.total = 0;
      chunk.pendingRetry = false;
    },

    // 新增：创建并发送请求
    async createAndSendRequest(chunk) {
      chunk.xhr = new XMLHttpRequest();
      
      // 添加事件监听器
      this.addXhrEventListeners(chunk);
      
      // 准备请求数据
      const uploadMethod = this.evalOpts(this.opts.uploadMethod, chunk.file, chunk);
      const data = this.prepareXhrRequest(chunk, uploadMethod, false, chunk.bytes);
      
      // 发送请求
      chunk.xhr.send(data);
    },

    // 新增：添加XHR事件监听器
    addXhrEventListeners(chunk) {
      const that = this;
      
      chunk.xhr.upload.addEventListener("progress", function(e) {
        that.handleProgress(chunk, e);
      }, false);
      
      chunk.xhr.addEventListener("load", function() {
        that.handleLoad(chunk);
      }, false);
      
      chunk.xhr.addEventListener("error", function() {
        that.handleLoad(chunk);
      }, false);
    },

    // 新增：处理进度事件
    handleProgress(chunk, e) {
      if (e.lengthComputable) {
        chunk.loaded = e.loaded;
        chunk.total = e.total;
      }
      this.event(chunk, this.STATUS.PROGRESS);
    },

    // 新增：处理加载完成事件
    async handleLoad(chunk) {
      const msg = chunk.message();
      chunk.processingResponse = true;

      try {
        await this.opts.processResponse(msg, (err, res) => {
          this.handleResponseProcessed(chunk, err, res);
        }, chunk.file, chunk);
      } catch (error) {
        console.error('处理响应时发生错误:', error);
        this.handleChunkError(chunk, error);
      }
    },

    // 新增：处理响应处理完成
    handleResponseProcessed(chunk, err, res) {
      chunk.processingResponse = false;
      
      if (!chunk.xhr) {
        return;
      }

      chunk.processedState = { err, res };
      const status = chunk.status();
      
      console.log("分片状态:", status);

      if (status === this.STATUS.SUCCESS || status === this.STATUS.ERROR) {
        this.event(chunk, status, res);
      } else {
        this.handleRetry(chunk, res);
      }
    },

    // 新增：处理重试
    handleRetry(chunk, res) {
      this.event(chunk, this.STATUS.RETRY, res);
      chunk.pendingRetry = true;
      chunk.abort();
      chunk.retries++;

      const retryInterval = this.opts.chunkRetryInterval;
      if (retryInterval !== null) {
        setTimeout(() => chunk.send(), retryInterval);
      } else {
        chunk.send();
      }
    },

    // 新增：处理分片错误
    handleChunkError(chunk, error) {
      console.error('分片错误:', error);
      chunk.file.error = chunk.file.allError = true;
      chunk.file.abort(chunk.file, chunk.tested);
      this.fileError(chunk.file, error.message, chunk);
    },

    // 中止分片上传操作 - 优化版本
    _abort(chunk) {
      const xhr = chunk.xhr;
      chunk.xhr = null;
      chunk.processingResponse = false;
      chunk.processedState = null;
      
      if (xhr) {
        xhr.abort();
        // 清理内存
        this.updateMemoryUsage(-(chunk.bytes ? chunk.bytes.size : 0));
      }
    },

    // 检测分片上传 - 优化版本
    async test(chunk) {
      try {
        chunk.xhr = new XMLHttpRequest();
        chunk.xhr.addEventListener("load", () => this.handleTestLoad(chunk), false);
        chunk.xhr.addEventListener("error", () => this.handleTestLoad(chunk), false);
        
        const testMethod = this.opts.testMethod;
        const data = this.prepareXhrRequest(chunk, testMethod, true);
        chunk.xhr.send(data);
      } catch (error) {
        console.error('测试分片时发生错误:', error);
        this.handleChunkError(chunk, error);
      }
    },

    // 新增：处理测试加载完成
    async handleTestLoad(chunk) {
      const status = chunk.status(chunk, true);

      if (status === this.STATUS.ERROR) {
        this.event(chunk, status, chunk.message());
      } else if (status === this.STATUS.SUCCESS) {
        await this.handleTestSuccess(chunk);
      } else if (!chunk.file.paused) {
        chunk.tested = true;
        chunk.send();
      }
    },

    // 新增：处理测试成功
    async handleTestSuccess(chunk) {
      if (this.isFunction(this.opts.initTask) && !chunk.initask) {
        try {
          const initres = await this.opts.initTask(chunk.file, chunk.message());
          console.log("initres", initres);
          
          // 标记所有分片已初始化任务
          for (const c of chunk.file.chunks) {
            c.initask = true;
          }
        } catch (error) {
          console.error('初始化任务失败:', error);
          this.handleChunkError(chunk, error);
          return;
        }
      }

      this.event(chunk, this.STATUS.SUCCESS, chunk.message());
      chunk.tested = true;
    },

    // 分片上传响应 - 优化版本
    message(chunk) {
      return chunk.xhr ? chunk.xhr.responseText : "";
    },

    // 准备XHR请求数据 - 优化版本
    prepareXhrRequest(chunk, method, isTest, blob) {
      // 优化查询参数生成
      const query = this.generateQueryParams(chunk, isTest);
      let target = this.evalOpts(this.opts.target, chunk.file, chunk, isTest);
      
      let data = null;

      if (method === "GET") {
        const params = this.buildQueryString(query);
        target = this.getTarget(target, params);
      } else {
        data = this.buildFormData(query, blob, chunk);
      }

      // 配置XHR
      this.configureXhr(chunk.xhr, method, target);

      return data;
    },

    // 新增：生成查询参数
    generateQueryParams(chunk, isTest) {
      let query = this.evalOpts(this.opts.query, chunk.file, chunk, isTest);
      query = { ...chunk.getParams(), ...query };
      return this.opts.processParams(query, chunk.file, chunk, isTest);
    },

    // 新增：构建查询字符串
    buildQueryString(query) {
      return Object.entries(query).map(([k, v]) => 
        `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
      );
    },

    // 新增：构建FormData
    buildFormData(query, blob, chunk) {
      const data = new FormData();
      
      for (const [k, v] of Object.entries(query)) {
        data.append(k, v);
      }

      if (typeof blob !== "undefined") {
        data.append(this.opts.fileParameterName, blob, chunk.file.name);
      }

      return data;
    },

    // 新增：配置XHR
    configureXhr(xhr, method, target) {
      xhr.open(method, target, true);
      xhr.withCredentials = false;

      for (const [k, v] of Object.entries(this.opts.headers)) {
        xhr.setRequestHeader(k, v);
      }
    },

    // 此函数用于将查询参数拼接到目标URL上 - 优化版本
    getTarget(target, params) {
      if (!params.length) {
        return target;
      }
      
      const separator = target.includes('?') ? '&' : '?';
      return target + separator + params.join('&');
    },

    // 处理分片事件的函数 - 优化版本
    event(chunk, status, message) {
      const triggerProgress = (file) => {
        this._measureSpeed(file);
        this.fileProgress(file, chunk);
        file._lastProgressCallback = Date.now();
      };

      switch (status) {
        case this.STATUS.PROGRESS:
          if (this._checkProgress(chunk.file)) {
            triggerProgress(chunk.file);
          }
          break;
        case this.STATUS.ERROR:
          this.handleErrorEvent(chunk, message);
          break;
        case this.STATUS.SUCCESS:
          this.handleSuccessEvent(chunk, message, triggerProgress);
          break;
        case this.STATUS.RETRY:
          this.fileRetry(chunk.file, chunk);
          break;
      }
    },

    // 新增：处理错误事件
    handleErrorEvent(chunk, message) {
      chunk.file.error = chunk.file.allError = true;
      chunk.file.abort(chunk.file, chunk.tested);
      this.fileError(chunk.file, message, chunk);
    },

    // 新增：处理成功事件
    handleSuccessEvent(chunk, message, triggerProgress) {
      this.updateUploadedChunks(message, chunk);
      
      if (chunk.file.error) {
        return;
      }

      this.handleProgressUpdate(chunk, triggerProgress);
      
      if (chunk.file.isComplete()) {
        this.handleFileComplete(chunk, triggerProgress);
      } else if (!chunk.file._progeressId) {
        triggerProgress(chunk.file);
      }
    },

    // 新增：处理进度更新
    handleProgressUpdate(chunk, triggerProgress) {
      clearTimeout(chunk.file._progeressId);
      chunk.file._progeressId = 0;
      
      const timeDiff = Date.now() - chunk.file._lastProgressCallback;
      if (timeDiff < this.opts.progressCallbacksInterval) {
        chunk.file._progeressId = setTimeout(
          () => triggerProgress(chunk.file),
          this.opts.progressCallbacksInterval - timeDiff
        );
      }
    },

    // 新增：处理文件完成
    handleFileComplete(chunk, triggerProgress) {
      clearTimeout(chunk.file._progeressId);
      triggerProgress(chunk.file);
      chunk.file.currentSpeed = 0;
      chunk.file.averageSpeed = 0;
      this.fileSuccess(chunk.file, chunk.message(), chunk);
    },

    // 检查是否达到进度回调的时间间隔 - 优化版本
    _checkProgress(file) {
      return Date.now() - file._lastProgressCallback >= this.opts.progressCallbacksInterval;
    },

    // 计算文件上传速度 - 优化版本
    _measureSpeed(file) {
      const smoothingFactor = this.opts.speedSmoothingFactor;
      const timeSpan = Date.now() - file._lastProgressCallback;
      
      if (!timeSpan) {
        return;
      }
      
      const uploaded = file.sizeUploaded();
      const currentSpeed = Math.max(
        ((uploaded - file._prevUploadedSize) / timeSpan) * 1000,
        0
      );
      
      file.currentSpeed = currentSpeed;
      file.averageSpeed = smoothingFactor * currentSpeed + (1 - smoothingFactor) * file.averageSpeed;
      file._prevUploadedSize = uploaded;
    },

    // 计算分片的上传进度 - 优化版本
    _progress(chunk) {
      if (chunk.pendingRetry) {
        return 0;
      }
      
      const status = chunk.status();
      
      if (status === this.STATUS.SUCCESS || status === this.STATUS.ERROR) {
        return 1;
      } else if (status === this.STATUS.PENDING) {
        return 0;
      } else {
        return chunk.total > 0 ? chunk.loaded / chunk.total : 0;
      }
    },

    // 计算分片已上传大小 - 优化版本
    _sizeUploaded(chunk) {
      let size = chunk.endByte - chunk.startByte;
      
      if (chunk.status() !== this.STATUS.SUCCESS) {
        size = chunk._progress() * size;
      }
      
      return size;
    },

    // 新增：清理资源
    cleanup() {
      this.chunkCache.clear();
      this.memoryUsage = 0;
    },
  },
};