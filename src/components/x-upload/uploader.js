export const uploader = {
  data() {
    return {
      // 判断浏览器是否具有window，具有则为false，否则为true
      isServer: typeof window === "undefined",
      // 判断是否为IE10及以上版本浏览器，若是则为true，否则为false
      ie10plus: this.isServer ? false : window.navigator.msPointerEnabled,
      // 表示是否支持文件上传功能，初始值为true
      support: true,
      // 切片方法名，默认值为'slice'
      sliceName: "slice",

      // 文件列表
      files: [],
    };
  }, 
  methods: {
    // 添加文件到上传队列
    addFiles(files) {
      for (const file of files) {
        // 如果当前浏览器不是 IE10/IE11（!ie10plus），或者虽然是 IE10/IE11 但文件大小大于 0，则通过检查。
        // 这是为了避免在 IE10/IE11 中上传空文件导致程序挂起的问题。
        // 如果文件大小是 4096 的倍数且文件名是 . 或 fileName 是 .，则认为这是一个目录文件，忽略它。
        if (
          (!this.ie10plus || (this.ie10plus && file.size > 0)) &&
          !(
            file.size % 4096 === 0 &&
            (file.name === "." || file.fileName === ".")
          )
        ) {
          // 初始化文件对象
          const _file = this.newFile(file);
          // 加入到渲染列表中
          this.files.push(_file);
          // 提交文件添加事件
          this.onFileAdded(_file);
        }
      }
    },

    // 添加单个文件到上传队列
    addFile(file) {
      this.addFiles([file]);
    },

    // 上传分片
    upload(file) {
      // 检查是否应该上传下一个分片
      let ret = this._shouldUploadNext(file);
      console.log(file.name + " 应该上传第几个切片", ret);
      // 如果不应该上传下一个分片，则直接返回
      if (ret === false) {
        return;
      }
      // 开始上传操作
      this.uploadStart();
      // 标记是否有分片开始上传
      let started = false;
      // 循环上传分片，直到达到同时上传的最大数量或没有更多分片可上传
      for (let num = 1; num <= this.opts.simultaneousUploads - ret; num++) {
        // 尝试上传下一个分片
        started = this.uploadNextChunk(file) || started;

        // 如果没有分片开始上传，说明上传完成，跳出循环
        if (!started) {
          // completed
          break;
        }
      }
      // 如果没有分片开始上传并且测试通过，说明文件上传完成，执行完成操作
      if (!started && file.tested) {
        this.complete(file);
      }
    },

    // 是否应该上传下一个分片
    _shouldUploadNext(file) {
      // 初始化正在上传的分片数量
      let num = 0;
      // 初始化是否应该上传下一个分片的标志
      let should = true;
      // 获取同时上传的最大分片数量
      let simultaneousUploads = this.opts.simultaneousUploads;
      // 定义正在上传的状态字符串
      let uploadingStatus = "uploading";

      // 遍历文件的所有分片
      for (const chunk of file.chunks) {
        // 检查当前分片是否正在上传
        if (chunk.status() === uploadingStatus) {
          // 正在上传的分片数量加1
          num++;
          // 如果正在上传的分片数量达到或超过同时上传的最大数量
          if (num >= simultaneousUploads) {
            // 不应该上传下一个分片
            should = false;
            // 返回 false 表示不应该上传下一个分片
            return false;
          }
        }
      }
      // 返回是否应该上传下一个分片的标志和正在上传的分片数量
      return should && num;
    },

    // 上传下一个分片
    uploadNextChunk(file) {
      // 标记是否找到待上传的分片
      let found = false;
      // 定义待上传状态的字符串
      let pendingStatus = "pending";
      // 获取检查分片是否已上传的配置项
      let checkChunkUploaded = this.opts.checkChunkUploadedByResponse;

      // 检查文件是否未暂停
      if (!file.paused) {
        // 如果配置了检查分片上传情况，且文件未收到第一个响应，且文件正在上传中
        if (checkChunkUploaded && !file._firstResponse && file.isUploading()) {
          // 等待当前文件的第一个分片响应，不做处理直接返回
          return;
        }
        // 遍历文件的所有分片
        for (const chunk of file.chunks) {
          // 检查当前分片的状态是否为待上传

          if (chunk.status() === pendingStatus) {
            // 发送当前分片
            chunk.send();
            // 标记已找到待上传的分片
            found = true;
            // 已找到并处理了一个待上传的分片，跳出循环
            break;
          }
        }
      }

      // 如果找到待上传的分片
      if (found) {
        // 返回true，表示有分片开始上传
        return true;
      }

      // let outstanding = false
      // if (!file.isComplete()) {
      // 	outstanding = true
      // 	return false
      // }
      // if (!outstanding && file.chunks.length) {
      // 	this.complete()
      // }
      // return outstanding
    },

    // 更新已上传的分片
    updateUploadedChunks(message, chunk) {
      // 获取检查分片是否已上传的配置项
      let checkChunkUploaded = this.opts.checkChunkUploadedByResponse;
      // 如果配置项存在
      if (checkChunkUploaded) {
        // 获取当前分片的xhr对象
        let xhr = chunk.xhr;
        // 遍历所有分片
        for (const _chunk of chunk.file.chunks) {
          // 如果该分片未被测试过
          if (!_chunk.tested) {
            // 检查该分片是否已上传
            let uploaded = checkChunkUploaded.call(this, _chunk, message);
            // 如果当前分片未上传成功
            if (_chunk === chunk && !uploaded) {
              // 修复第一个分片的xhr状态，将其置为null，以便重新上传
              _chunk.xhr = null;
            }
            // 如果该分片已上传成功
            if (uploaded) {
              // 首次成功且其他分片已上传，然后设置xhr，这样已上传的分片也将被视为成功
              _chunk.xhr = xhr;
            }
            // 标记该分片已测试
            _chunk.tested = true;
          }
        }
        // 如果文件还没有收到第一个响应
        if (!chunk.file._firstResponse) {
          // 标记首次响应
          chunk.file._firstResponse = true;
          // 重新开始上传该文件
          this.upload(chunk.file);
        } else {
          // 上传下一个分片
          this.uploadNextChunk(chunk.file);
        }
      } else {
        // 上传下一个分片
        this.uploadNextChunk(chunk.file);
      }
    },

    removeFile(file) {
      this.files = this.files.filter((f) => f !== file);
      this.fileRemoved(file);
    },

    // 动态调整并发数
    adjustConcurrency() {
      try {
        const optimalConcurrency = this.getOptimalConcurrency();
        const currentConcurrency = this.opts.simultaneousUploads;
        
        if (optimalConcurrency !== currentConcurrency) {
          console.log(`动态调整并发数: ${currentConcurrency} -> ${optimalConcurrency}`);
          this.opts.simultaneousUploads = optimalConcurrency;
          
          // 重新启动上传队列
          this.processQueue();
        }
      } catch (error) {
        console.warn('动态调整并发数失败:', error);
      }
    },

    // 获取最优并发数
    getOptimalConcurrency() {
      try {
        // 使用性能优化器的建议
        return performanceOptimizer.getOptimalConcurrency();
      } catch (error) {
        // 如果性能监控不可用，使用基于网络速度的计算
        const networkSpeed = this.networkSpeed || 5;
        if (networkSpeed > 10) {
          return 8; // 高速网络
        } else if (networkSpeed > 5) {
          return 6; // 中速网络
        } else {
          return 4; // 低速网络
        }
      }
    },
  },
  created() {
    // 检查是否具有window，不具有设置支持状态为false，否则继续检查浏览器是否支持File、Blob和FileList对象
    if (this.isServer) {
      this.support = false;
      return;
    }
    // 初始化切片方法名
    let sliceName = "slice";
    // 检查浏览器是否支持File、Blob和FileList对象
    let _support =
      typeof window.File !== "undefined" &&
      typeof window.Blob !== "undefined" &&
      typeof window.FileList !== "undefined";
    let bproto = null;
    if (_support) {
      // 获取Blob对象的原型
      bproto = window.Blob.prototype;
      // 遍历可能的切片方法名
      for (const n of ["slice", "webkitSlice", "mozSlice"]) {
        // 如果找到支持的切片方法名
        if (bproto[n]) {
          // 更新切片方法名
          sliceName = n;
          return false;
        }
      }
      // 检查最终的切片方法名是否可用
      _support = !!bproto[sliceName];
    }
    // 如果支持切片方法，则更新实例的切片方法名
    if (_support) this.sliceName = sliceName;
    // 释放对Blob原型的引用
    bproto = null;
    // 更新实例的支持状态
    this.support = _support;
  },
};
