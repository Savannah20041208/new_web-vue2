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
<<<<<<< HEAD
    };
  },
  methods: { 
    // 创建新的分片对象
    newChunk(file, offset) {
      // 创建一个空对象作为新的分片
      const chunk = Object.create(null);

      this.defineNonEnumerable(chunk, "file", file); // 定义不可枚举的属性 'file'，存储初始化file
      this.defineNonEnumerable(chunk, "bytes", null); // 定义不可枚举的属性 'bytes'，初始值为 null

      chunk.offset = offset; // 分片的顺序号，从参数中获取

      chunk.tested = false; // 标记分片是否已测试（断点续传等），初始为 false
      chunk.initask = false; // 标记分片是否已初始化任务（根据配置参数决定是否进行初始化接口调用），初始为 false
      chunk.retries = 0; // 记录分片的重试次数，初始为 0
      chunk.pendingRetry = false; // 标记分片是否有待重试，初始为 false
      chunk.preprocessState = 0; // 分片预处理状态，初始为 0
      chunk.readState = 0; // 分片读取状态，初始为 0
      chunk.loaded = 0; // 分片已加载的字节数，初始为 0
      chunk.total = 0; // 分片的总字节数，初始为 0
      chunk.chunkSize = this.opts.chunkSize; // 分片的大小，从配置中获取
      chunk.startByte = chunk.offset * chunk.chunkSize; // 分片的起始字节位置
      chunk.endByte = this.computeEndByte(chunk); // 计算分片的结束字节位置
      chunk.xhr = null; // 分片的 XMLHttpRequest 对象，初始为 null

      chunk.status = () => this.status(chunk); // 获取分片状态的方法
      chunk.send = () => this.send(chunk); // 发送分片的方法
      chunk.readFinished = (bytes) => {
        // 分片读取完成的回调方法
        // 更新分片读取状态为 2
        chunk.readState = 2;
        // 设置分片的字节数据
        chunk.bytes = bytes;
        // 发送分片
        chunk.send();
      };
      chunk.message = () => this.message(chunk); // 获取分片响应消息的方法
      chunk.getParams = () => this.getParams(chunk); // 获取分片参数的方法
      chunk.abort = () => this._abort(chunk); // 中止分片上传的方法
      chunk._progress = () => this._progress(chunk); // 计算分片上传进度的方法
      chunk._sizeUploaded = () => this._sizeUploaded(chunk); // 计算分片已上传大小的方法

      // 返回创建好的分片对象
      return chunk;
    },

    // 计算分片的结束字节，取文件大小和当前分片顺序乘以分片大小加1的最小值
    computeEndByte(chunk) {
      // 首先计算当前分片理论上的结束字节位置，取文件大小和 (chunk.offset + 1) * chunk.chunkSize 中的较小值
      let endByte = Math.min(
        chunk.file.size,
        (chunk.offset + 1) * chunk.chunkSize,
      );
      // 如果文件剩余大小小于分片大小，并且没有强制要求分片大小，则将结束字节设置为文件大小
      if (
        chunk.file.size - endByte < chunk.chunkSize &&
        !this.opts.forceChunkSize
      ) {
        endByte = chunk.file.size;
      }
      // 返回计算得到的结束字节位置
=======
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
      
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc
      return endByte;
    },

    /**
<<<<<<< HEAD
     * 检查分片的状态。
     * @param {Object} chunk - 要检查状态的分片对象。
     * @param {boolean} [isTest=false] - 是否为测试模式，默认为false。
     * @returns {string} - 分片的状态，可能的值为：
     *   - 'pending': 待处理状态，表示分片尚未开始上传。
     *   - 'uploading': 上传中状态，表示分片正在上传。
     *   - 'success': 成功状态，表示分片上传成功。
     *   - 'error': 错误状态，表示分片上传失败。
     *   - 'complete': 完成状态，表示分片上传完成。
     */
    status(chunk, isTest) {
      if (chunk.readState === 1) {
        // 如果分片正在读取中，返回读取中状态
        return this.STATUS.READING;
      } else if (chunk.pendingRetry || chunk.preprocessState === 1) {
        // 如果分片处于重试待办状态或预处理状态，返回上传中状态
        // 如果处于重试待办状态，那么实际上就等同于正在上传，
        // 可能只是在重试开始前会有轻微延迟
        return this.STATUS.UPLOADING;
      } else if (!chunk.xhr) {
        // 如果分片的XMLHttpRequest对象不存在，返回待处理状态
        return this.STATUS.PENDING;
      } else if (chunk.xhr.readyState < 4 || chunk.processingResponse) {
        // 如果XMLHttpRequest对象正在处理中或者切片正在处理响应，返回上传中状态
        // 0 (UNSENT)：代理被创建，但尚未调用`open()` 方法；
        // 1 (OPENED)：`open()` 方法已经被调用；
        // 2 (HEADERS_RECEIVED)：`send()` 方法已经被调用，并且头部和状态已经可获得；
        // 3 (LOADING)：下载中，`responseText` 属性已经包含部分数据；
        // 4 (DONE)：下载操作已完成
        return this.STATUS.UPLOADING;
      } else {
        let _status;
        if (
          this.opts.successStatuses.indexOf(chunk.xhr.status) > -1 &&
          (!this.opts.successApiStatuses.code ||
            chunk.xhr.responseText.includes(
              this.opts.successApiStatuses.code,
            )) &&
          (!this.opts.successApiStatuses.state ||
            chunk.xhr.responseText.includes(this.opts.successApiStatuses.state))
        ) {
          // 检查HTTP状态码和API响应状态码（配置了successApiStatuses属性的code和state）是否符合成功条件
          // HTTP 200，完美
          // HTTP 201 Created - 已创建
          // HTTP 202 Accepted - 请求已被接受处理，但处理尚未完成
          _status = this.STATUS.SUCCESS;
        } else if (
          this.opts.permanentErrors.indexOf(chunk.xhr.status) > -1 ||
          (!isTest && chunk.retries >= this.opts.maxChunkRetries)
          // ||
          // (this.opts.successApiStatuses.code && !chunk.xhr.responseText.includes(this.opts.successApiStatuses.code)) ||
          // (this.opts.successApiStatuses.state && !chunk.xhr.responseText.includes(this.opts.successApiStatuses.state))
        ) {
          // 检查HTTP状态码和API响应状态码（配置了successApiStatuses属性的code和state）是否符合永久错误条件
          // HTTP 404/415/500/501，永久性错误
          _status = this.STATUS.ERROR;
        } else {
          // 重置并排队重试
          chunk.abort();
          _status = this.STATUS.PENDING;
        }
        // 检查处理状态是否有错误
        let processedState = chunk.processedState;
        if (processedState && processedState.err) {
          _status = this.STATUS.ERROR;
        }
        return _status;
      }
    },

    // 获取分片参数
    getParams(chunk) {
      // 返回一个包含分片信息的对象
      return {
        // 分片的编号，从1开始计数
        chunkNumber: chunk.offset + 1,
        // 分片的大小，从配置中获取
        chunkSize: this.opts.chunkSize,
        // 当前分片的实际大小
        currentChunkSize: chunk.endByte - chunk.startByte,
        // 文件的总大小
        totalSize: chunk.file.size,
        // 文件的唯一标识符
        identifier: chunk.file.uniqueIdentifier,
        // 文件名
        filename: chunk.file.name,
        // 文件的相对路径
        relativePath: chunk.file.relativePath,
        // 文件的总分片数
        totalChunks: chunk.file.chunks.length,
      };
    },

    // 发送分片的函数
    send(chunk) {
      // 获取预处理配置
      let preprocess = this.opts.preprocess;

      // 如果存在预处理函数
      if (this.isFunction(preprocess)) {
        // 根据预处理状态进行处理
        switch (chunk.preprocessState) {
          // 预处理状态为0，即未开始预处理
          case 0:
            // 更新预处理状态为1，表示正在预处理
            chunk.preprocessState = 1;
            // 执行预处理函数
            preprocess(chunk);
            return;
          // 预处理状态为1，即正在预处理
          case 1:
            return;
        }
      }

      // 根据分片读取状态进行处理
      switch (chunk.readState) {
        // 读取状态为0，即未开始读取
        case 0:
          // 更新读取状态为1，表示正在读取
          chunk.readState = 1;
          // 调用读取完成回调函数，传入分片数据
          chunk.readFinished(
            chunk.file.file[this.sliceName](
              chunk.startByte,
              chunk.endByte,
              chunk.file.fileType,
            ),
          );
          return;
        // 读取状态为1，即正在读取
        case 1:
          return;
      }

      // 如果需要测试分片且该分片未测试过
      if (this.opts.testChunks && !chunk.tested) {
        // 调用测试函数
        this.test(chunk);
        return;
      }

      // 重置分片的已加载字节数、总字节数和待重试标记
      chunk.loaded = 0;
      chunk.total = 0;
      chunk.pendingRetry = false;

      // 创建一个新的XMLHttpRequest对象
      chunk.xhr = new XMLHttpRequest();
      // 为上传进度事件添加监听器
      chunk.xhr.upload.addEventListener("progress", progressHandler, false);
      // 为加载完成事件添加监听器
      chunk.xhr.addEventListener("load", doneHandler, false);
      // 为加载错误事件添加监听器
      chunk.xhr.addEventListener("error", doneHandler, false);

      // 获取上传方法
      let uploadMethod = this.evalOpts(
        this.opts.uploadMethod,
        chunk.file,
        chunk,
      );
      // 准备XHR请求数据
      let data = this.prepareXhrRequest(
        chunk,
        uploadMethod,
        false,
        chunk.bytes,
      );
      // 发送请求
      chunk.xhr.send(data);

      let that = this;
      // 上传进度事件处理函数
      function progressHandler(e) {
        // 如果可以获取进度信息
        if (e.lengthComputable) {
          // 更新分片的已加载字节数和总字节数
          chunk.loaded = e.loaded;
          chunk.total = e.total;
        }
        // 触发进度事件
        that.event(chunk, that.STATUS.PROGRESS);
      }

      // 加载完成或错误事件处理函数
      function doneHandler() {
        //console.log('doneHandler');

        // 获取分片响应消息
        let msg = chunk.message();
        // 标记正在处理响应
        chunk.processingResponse = true;

        // 处理响应消息
        that.opts.processResponse(
          msg,
          function (err, res) {
            // 标记处理响应完成
            chunk.processingResponse = false;
            // 如果XMLHttpRequest对象已被清空，直接返回
            if (!chunk.xhr) {
              return;
            }
            // 记录处理结果
            chunk.processedState = {
              err: err,
              res: res,
            };
            // 获取分片状态
            let status = chunk.status();
            console.log("--------------", status);

            // 如果状态为成功或错误
            if (
              status === that.STATUS.SUCCESS ||
              status === that.STATUS.ERROR
            ) {
              // 触发相应事件
              that.event(chunk, status, res);
              // 如果状态为错误，上传下一个分片
              // status === that.STATUS.ERROR && that.uploadNextChunk(chunk.file)
            } else {
              // 触发重试事件
              that.event(chunk, that.STATUS.RETRY, res);
              // 标记分片有待重试
              chunk.pendingRetry = true;
              // 中止当前请求
              chunk.abort();
              // 增加重试次数
              chunk.retries++;
              // 获取重试间隔
              let retryInterval = that.opts.chunkRetryInterval;
              // 如果存在重试间隔
              if (retryInterval !== null) {
                // 延迟指定时间后重新发送分片
                setTimeout(function () {
                  chunk.send();
                }, retryInterval);
              } else {
                // 立即重新发送分片
                chunk.send();
              }
            }
          },
          chunk.file,
          chunk,
        );
      }
    },

    // 中止分片上传操作，重置相关状态并中止当前的XMLHttpRequest请求
    _abort(chunk) {
      // 获取当前分片的XMLHttpRequest对象
      let xhr = chunk.xhr;
      // 清空当前分片的XMLHttpRequest对象引用
      chunk.xhr = null;
      // 标记当前分片不再处理响应
      chunk.processingResponse = false;
      // 清空当前分片的处理状态
      chunk.processedState = null;
      // 如果存在XMLHttpRequest对象，则中止该请求
      if (xhr) {
        xhr.abort();
      }
    },

    // 检测分片上传
    test(chunk) {
      // 创建一个新的XMLHttpRequest对象
      chunk.xhr = new XMLHttpRequest();
      // 为加载完成事件添加监听器
      chunk.xhr.addEventListener("load", testHandler, false);
      // 为加载错误事件添加监听器
      chunk.xhr.addEventListener("error", testHandler, false);
      // 获取测试方法
      let testMethod = this.opts.testMethod;
      // 准备XHR请求数据
      let data = this.prepareXhrRequest(chunk, testMethod, true);
      // 发送请求
      chunk.xhr.send(data);

      let that = this;
      async function testHandler() {
        // 获取分片状态
        let status = chunk.status(chunk, true);

        // 如果状态为错误
        if (status === that.STATUS.ERROR) {
          // 触发错误事件
          that.event(chunk, status, chunk.message());
          // 上传下一个分片 (是否需要根据切片数重试测试接口)
          // that.uploadNextChunk(chunk.file)
          // 如果状态为成功
        } else if (status === that.STATUS.SUCCESS) {
          // 如果存在初始化任务函数，且需要测试分片，且该分片已测试过，且未初始化任务
          if (that.isFunction(that.opts.initTask) && !chunk.initask) {
            // 异步执行初始化任务函数
            const initres = await that.opts.initTask(
              chunk.file,
              chunk.message(),
            );
            console.log("initres", initres);
            // 标记所有分片已初始化任务
            for (const c of chunk.file.chunks) {
              c.initask = true;
            }
          }

          // 触发成功事件
          that.event(chunk, status, chunk.message());
          // 标记分片已测试
          chunk.tested = true;
        } else if (!chunk.file.paused) {
          // TODO  // 如果文件未暂停
          // 由文件暂停方法引起
          // 分块在服务器端不存在
          // 标记分片已测试
          chunk.tested = true;
          // 发送分片
          chunk.send();
        }
      }
    },

    // 分片上传响应
    // 返回分片上传的响应文本，如果存在XMLHttpRequest对象，则返回其响应文本，否则返回空字符串
=======
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
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc
    message(chunk) {
      return chunk.xhr ? chunk.xhr.responseText : "";
    },

<<<<<<< HEAD
    // 准备XHR请求数据
    prepareXhrRequest(chunk, method, isTest, blob) {
      // 根据配置和分片信息生成查询参数
      let query = this.evalOpts(this.opts.query, chunk.file, chunk, isTest);
      // 合并分片参数和查询参数
      query = { ...chunk.getParams(), ...query };
      // 对查询参数进行处理
      query = this.opts.processParams(query, chunk.file, chunk, isTest);

      // 根据配置和分片信息生成请求目标URL
      let target = this.evalOpts(this.opts.target, chunk.file, chunk, isTest);
      let data = null;

      // 如果请求方法为GET
      if (method === "GET") {
        let params = [];
        // 对查询参数进行编码并拼接成字符串
        for (let k in query) {
          params.push(
            [encodeURIComponent(k), encodeURIComponent(query[k])].join("="),
          );
        }

        // 将参数拼接到目标URL上
        target = this.getTarget(target, params);
        // 如果请求方法不是GET
      } else {
        // 创建一个FormData对象
        data = new FormData();
        // 将查询参数添加到FormData对象中
        for (const k in query) {
          data.append(k, query[k]);
        }

        // 如果存在二进制数据
        if (typeof blob !== "undefined") {
          // 将二进制数据添加到FormData对象中
          data.append(this.opts.fileParameterName, blob, chunk.file.name);
        }
      }

      // 打开XHR请求
      chunk.xhr.open(method, target, true);
      // 设置是否携带跨域凭证
      chunk.xhr.withCredentials = false;
      

      // 设置请求头
      for (const k in this.opts.headers) {
        chunk.xhr.setRequestHeader(k, this.opts.headers[k]);
      }

      // 返回请求数据
      return data;
    },

    // 此函数用于将查询参数拼接到目标URL上
    getTarget(target, params) {
      // 如果参数数组为空，则直接返回目标URL
      if (!params.length) {
        return target;
      }
      // 如果目标URL中不包含问号，则添加问号
      if (target.indexOf("?") < 0) {
        target += "?";
        // 否则，添加&符号
      } else {
        target += "&";
      }
      // 将参数数组拼接成字符串，并添加到目标URL后面
      return target + params.join("&");
    },

    // 处理分片事件的函数，根据不同的状态执行相应的操作
    event(chunk, status, message) {
      let that = this;
      // 定义触发进度更新的函数，用于更新文件上传速度和进度信息
      let triggerProgress = function (file) {
        that._measureSpeed(file); // 计算文件上传速度
        that.fileProgress(file, chunk); // 更新文件进度信息
        file._lastProgressCallback = Date.now(); // 记录上次进度回调的时间
      };

      // 根据不同的状态执行不同的操作
      switch (status) {
        // 当状态为进度更新时
        case this.STATUS.PROGRESS:
          // 检查是否达到进度回调的时间间隔
          if (this._checkProgress(chunk.file)) {
            triggerProgress(chunk.file); // 触发进度更新
          }
          break;
        // 当状态为错误时
        case this.STATUS.ERROR:
          chunk.file.error = chunk.file.allError = true; // 标记文件出现错误
          // 测试接口出错，中断上传
          chunk.file.abort(chunk.file, chunk.tested); // 中止文件上传操作
          this.fileError(chunk.file, message, chunk); // 处理文件上传错误的操作
          break;
        // 当状态为成功时
        case this.STATUS.SUCCESS:
          this.updateUploadedChunks(message, chunk); // 更新已上传的分片信息
          // 如果文件已经出现错误，则不进行后续操作
          if (chunk.file.error) {
            return;
          }
          clearTimeout(chunk.file._progeressId); // 清除进度更新的定时器
          chunk.file._progeressId = 0; // 重置进度更新的定时器ID
          var timeDiff = Date.now() - chunk.file._lastProgressCallback; // 计算当前时间与上次进度回调时间的差值
          // 如果时间差值小于进度回调的时间间隔，则重新设置定时器
          if (timeDiff < this.opts.progressCallbacksInterval) {
            chunk.file._progeressId = setTimeout(
              triggerProgress(chunk.file),
              this.opts.progressCallbacksInterval - timeDiff,
            );
          }
          // 如果文件已经完成上传
          if (chunk.file.isComplete()) {
            clearTimeout(chunk.file._progeressId); // 清除进度更新的定时器
            triggerProgress(chunk.file); // 触发进度更新
            chunk.file.currentSpeed = 0; // 重置文件当前速度
            chunk.file.averageSpeed = 0; // 重置文件平均速度
            this.fileSuccess(chunk.file, message, chunk); // 处理文件上传成功的操作
          } else if (!chunk.file._progeressId) {
            triggerProgress(chunk.file); // 触发进度更新
          }
          break;
        // 当状态为重试时
=======
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
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc
        case this.STATUS.RETRY:
          this.fileRetry(chunk.file, chunk);
          break;
      }
    },

<<<<<<< HEAD
    // 检查是否达到进度回调的时间间隔
    _checkProgress(file) {
      return (
        Date.now() - file._lastProgressCallback >=
        this.opts.progressCallbacksInterval
      );
    },

    // 计算文件上传速度，避免文件恢复上传后出现负速度
    _measureSpeed(file) {
      // 从配置中获取速度平滑因子
      let smoothingFactor = this.opts.speedSmoothingFactor;
      // 计算当前时间与上次进度回调时间的差值
      let timeSpan = Date.now() - file._lastProgressCallback;
      // 如果时间差值为0，则不进行计算，直接返回
      if (!timeSpan) {
        return;
      }
      // 获取文件已上传的大小
      let uploaded = file.sizeUploaded();
      // 计算文件当前速度，取计算结果和0的最大值，避免出现负速度
      file.currentSpeed = Math.max(
        ((uploaded - file._prevUploadedSize) / timeSpan) * 1000,
        0,
      );
      // 根据平滑因子更新文件的平均速度
      file.averageSpeed =
        smoothingFactor * file.currentSpeed +
        (1 - smoothingFactor) * file.averageSpeed;
      // 更新上次已上传大小，用于下一次计算
      file._prevUploadedSize = uploaded;
    },

    // 计算分片的上传进度
    _progress(chunk) {
      // 如果分片处于重试待办状态，返回进度为0
      if (chunk.pendingRetry) {
        return 0;
      }
      // 获取分片的状态
      let s = chunk.status();
      // 如果分片状态为成功或错误，返回进度为1
      if (s === this.STATUS.SUCCESS || s === this.STATUS.ERROR) {
        return 1;
      } else if (s === this.STATUS.PENDING) {
        // 如果分片状态为待处理，返回进度为0
        return 0;
      } else {
        // 否则，根据分片的已加载字节数和总字节数计算进度
=======
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
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc
        return chunk.total > 0 ? chunk.loaded / chunk.total : 0;
      }
    },

<<<<<<< HEAD
    _sizeUploaded(chunk) {
      // 计算分片的总大小
      let size = chunk.endByte - chunk.startByte;
      // 注释：不能仅返回chunk.loaded的值，因为它可能大于分片大小
      // 如果分片状态不是成功状态，则根据上传进度计算已上传大小
      if (chunk.status() !== this.STATUS.SUCCESS) {
        size = chunk._progress() * size;
      }
      // 返回分片已上传的大小
      return size;
    },
  },
};
=======
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
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc
