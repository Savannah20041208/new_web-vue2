export const file = {
  data() {
    return {};
  },
  methods: {

    // 创建新的文件对象
    newFile(file) {
      const _file = Object.create(null); // 创建一个空对象，用于存储文件信息

      this.defineNonEnumerable(_file, "file", file); // 定义不可枚举的属性 'file'，存储源文件信息
      this.defineNonEnumerable(_file, "chunks", []); // 定义不可枚举的属性 'chunks'，存储文件的分片信息

      // 设置文件基础属性
      _file.id = this.uid(); // 为文件分配唯一ID 
      _file.fileType = file.type; // 设置文件类型
      _file.name = file.fileName || file.name; // 设置文件名称
      _file.size = file.size; // 设置文件大小
      _file.lastModified = file.lastModified; // 设置文件最后修改时间
      _file.relativePath =
        file.relativePath || file.webkitRelativePath || _file.name; // 设置文件相对路径

      // 设置文件状态
      _file.paused = this.opts.initialPaused; // 是否暂停上传
      _file.error = false; // 是否发生错误
      _file.allError = false; // 是否所有文件都发生错误
      _file.aborted = false; // 是否已中止上传
      _file.completed = false; // 是否已完成上传
      _file.isUploading = () => this.isUploading(_file); // 判断是否正在上传

      // 设置进度相关属性
      _file.averageSpeed = 0; // 平均速度
      _file.currentSpeed = 0; // 当前速度
      _file._lastProgressCallback = Date.now(); // 记录上次进度回调的时间戳
      _file._prevUploadedSize = 0; // 用于计算上传进度
      _file._prevProgress = 0; // 用于计算上传进度
      _file.progress = () => this.progress(_file); // 进度

      // 定义文件方法
      _file.upload = () => this.upload(_file); // 上传方法
      _file.abort = (file, reset) => this.abort(file, reset); // 中止
      _file.sizeUploaded = () => this.sizeUploaded(_file); // 已上传的大小
      _file.isComplete = () => this.isComplete(_file); // 是否完成
      _file.retry = () => this.retry(_file); // 重试
      _file.pause = () => this.pause(_file); // 暂停
      _file.resume = () => this.resume(_file); // 恢复
      _file.cancel = () => this.cancel(_file); // 删除

      // 初始化文件的分片信息
      this.bootstrap(_file);

      return _file;
    },

    // 初始化文件的分片信息。
    bootstrap(file) {
      // 将文件的上一次进度重置为0
      file._prevProgress = 0;
      // 使用当前配置的分片大小（可能已经根据文件大小动态调整过）
      const chunkSize = this.opts.chunkSize;
      // 根据配置项决定使用向上取整还是向下取整
      let round = this.opts.forceChunkSize ? Math.ceil : Math.floor;
      // 计算文件需要分成的分片数量，至少为1片
      let chunks = Math.max(round(file.size / this.opts.chunkSize), 1);
      // 循环创建每个分片并添加到文件的chunks数组中
      // 清空现有分片（如果重新初始化）
      file.chunks = [];

      for (let offset = 0; offset < chunks; offset++) {
        const chunk = this.newChunk(file, offset);
        // 确保每个分片使用当前的分片大小配置
        chunk.chunkSize = chunkSize;
        chunk.endByte = this.computeEndByte(chunk);
        file.chunks.push(chunk);
      }

      if (file.chunks.length === 1) {
        for (const chunk of file.chunks) {
          chunk.tested = true;
          chunk.initask = true;
        }
      }
      console.log(`文件 ${file.name} 分片配置: 
      总大小=${this.formatSize(file.size)}, 
      分片大小=${this.formatSize(chunkSize)}, 分片数=${chunks}`);
    },

    // 判断是否正在上传
    isUploading(file) {
      // 初始化上传状态为false
      let uploading = false;

      // 定义上传状态的字符串
      let uploadingStatus = "uploading";

      // 遍历文件的所有分片
      for (const chunk of file.chunks) {
        // 如果某个分片的状态为上传中

        if (chunk.status() === uploadingStatus) {
          // 将上传状态设置为true
          uploading = true;
          // 返回false，表示文件不在上传中
          break;
        }
      }

      // 如果所有分片都不在上传中，返回上传状态
      return uploading;
    },

    // 中止文件上传的方法，接收文件对象和重置标志作为参数
    abort(file, reset) {
      // 如果文件已经中止，直接返回，避免重复操作
      if (file.aborted) {
        return;
      }
      // 将文件的当前速度置为0
      file.currentSpeed = 0;
      // 将文件的平均速度置为0
      file.averageSpeed = 0;
      // 根据重置标志更新文件的中止状态
      file.aborted = !reset;
      // 获取文件的所有分片
      let chunks = file.chunks;
      // 如果需要重置，清空文件的分片信息
      if (reset) {
        file.chunks = [];
      }
      // 定义上传状态的常量
      let uploadingStatus = this.STATUS.UPLOADING;
      // 遍历文件的所有分片
      for (const c of chunks) {
        // 如果某个分片正在上传

        if (c.status() === uploadingStatus) {
          // 中止该分片的上传
          c.abort();
          // 尝试上传下一个分片
          // TODO: 这里可能需要优化，应该只尝试上传下一个分片，而不是重新上传整个文件 超时或者minio内存溢出
          // if (!file.aborted)
          // this.uploadNextChunk(file)
        }
      }
    },

    // 计算文件上传进度
    progress(file) {
      // 初始化返回值为0
      let ret = 0;

      // 如果文件存在错误，将返回值设为1并返回
      if (file.error) {
        ret = 1;
        return;
      }

      // 如果文件只有一个分片
      if (file.chunks.length === 1) {
        // 更新文件的上一次进度为当前进度和上一次进度的最大值
        file._prevProgress = Math.max(
          file._prevProgress,
          file.chunks[0]._progress(file.chunks[0]),
        );
        // 将返回值设为当前进度
        ret = file._prevProgress;
        return ret;
      }

      // 汇总所有分片的上传进度，初始化已加载字节数为0
      let bytesLoaded = 0;
      // 遍历文件的所有分片
      for (const c of file.chunks) {
        // 累加每个分片的已上传字节数
        bytesLoaded += c._progress(c) * (c.endByte - c.startByte);
      }
      // 计算已上传字节数占文件总大小的百分比
      let percent = bytesLoaded / file.size;
      // 避免在上传暂停时丢失进度百分比，更新文件的上一次进度为当前进度和上一次进度的最大值
      file._prevProgress = Math.max(
        file._prevProgress,
        percent > 0.9999 ? 1 : percent,
      );
      // 将返回值设为当前进度
      ret = file._prevProgress;
      return ret;
    },

    // 计算文件已上传的大小
    sizeUploaded(file) {
      let size = 0;
      // 遍历文件的所有分片，累加每个分片已上传的大小
      for (const chunk of file.chunks) {
        size += chunk._sizeUploaded();
      }
      return size;
    },

    // 判断文件是否上传完成
    isComplete(file) {
      // 如果文件状态还未标记为完成
      if (!file.completed) {
        let outstanding = false;
        // 如果文件存在错误，标记为有未完成的情况
        if (file.error) {
          outstanding = true;
        } else {
          let STATUS = this.STATUS;
          // 遍历文件的所有分片，检查是否有未完成或出错的分片
          for (const chunk of file.chunks) {
            let status = chunk.status();
            if (
              status === STATUS.ERROR ||
              status === STATUS.PENDING ||
              status === STATUS.UPLOADING ||
              status === STATUS.READING ||
              chunk.preprocessState === 1 ||
              chunk.readState === 1
            ) {
              outstanding = true;
              return false;
            }
          }
        }
        // 根据检查结果更新文件的完成状态
        file.completed = !outstanding;
      }
      return file.completed;
    },

    // 重试
    retry(file) {
      // 如果文件存在错误，则重新初始化文件
      if (file.error) {
        this.bootstrap(file);
      }
      // 重新上传文件
      this.upload(file);
    },

    // 暂停
    pause(file) {
      file.paused = true;
      file.abort(file);
    },

    // 恢复
    resume(file) {
      file.paused = false;
      file.aborted = false;
      file.upload(file);
    },

    // 删除
    cancel(file) {
      // 清除文件对象的引用，释放内存
      file.file = null;
      file.chunks = [];
      this.removeFile(file);
    },
  },
};
