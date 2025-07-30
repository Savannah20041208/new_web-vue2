// 1. 首先在 utils.js 中添加这两个函数
export const utils = {
  data() {
    return {
      i: 0,
      networkSpeed: 5, // 默认网络速度
    };
  },
  methods: {
    // 生成唯一ID
    uid() {
      return ++this.i;
    },

    // 定义不可枚举的属性
    defineNonEnumerable(target, key, value) {
      Object.defineProperty(target, key, {
        enumerable: false,
        configurable: true,
        writable: true,
        value: value,
      });
    },

    // 动态获取最优分片大小
    getOptimalChunkSize(fileSize) {
      if (fileSize < 50 * 1024 * 1024) { // 50MB以下
        return 2 * 1024 * 1024; // 2MB
      } else if (fileSize < 500 * 1024 * 1024) { // 500MB以下
        return 5 * 1024 * 1024; // 5MB
      } else {
        return 10 * 1024 * 1024; // 10MB
      }
    },

    // 动态获取最优并发数
    getOptimalConcurrency(networkSpeed) {
      if (networkSpeed > 10) { // 高速网络
        return 8;
      } else if (networkSpeed > 5) { // 中速网络
        return 6;
      } else {
        return 4; // 低速网络
      }
    },

    // 检测网络速度（简单实现）
    async detectNetworkSpeed() {
      try {
        const startTime = Date.now();
        // eslint-disable-next-line no-unused-vars
        const response = await fetch('/api/speed-test', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 根据响应时间估算网络速度
        if (duration < 100) {
          this.networkSpeed = 15; // 高速
        } else if (duration < 300) {
          this.networkSpeed = 8; // 中速
        } else {
          this.networkSpeed = 3; // 低速
        }
      } catch (error) {
        console.warn('网络速度检测失败，使用默认值');
        this.networkSpeed = 5;
      }
      return this.networkSpeed;
    },

    // 监听网络变化
    monitorNetworkStatus() {
      if (navigator.connection) {
        const connection = navigator.connection;
        // 根据网络类型设置速度
        switch (connection.effectiveType) {
          case '4g':
            this.networkSpeed = 15;
            break;
          case '3g':
            this.networkSpeed = 8;
            break;
          case '2g':
            this.networkSpeed = 3;
            break;
          default:
            this.networkSpeed = 5;
        }

        // 监听网络变化
        connection.addEventListener('change', () => {
          this.monitorNetworkStatus();
          // 触发重新配置
          this.$emit('network-changed', this.networkSpeed);
        });
      }
    },

    // 参数字符或方法判断
    evalOpts(data, args) {
      if (this.isFunction(data)) {
        args = this.toArray(arguments);
        data = data.apply(null, args.slice(1));
      }
      return data;
    },

    // 对象原型
    oproto() {
      return Object.prototype;
    },
    // 数组原型
    aproto() {
      return Array.prototype;
    },
    // 通过调用Object.prototype.toString方法，返回一个表示函数的字符串，用于判断函数类型
    serialize(fn) {
      return this.oproto().toString.call(fn);
    },

    // 判断传入的参数是否为函数类型
    isFunction(fn) {
      return this.serialize(fn) === "[object Function]";
    },
    // 判断传入的参数是否为数组类型
    isArray(ary) {
      return Array.isArray || this.serialize(ary) === "[object Array]";
    },
    // 将类数组对象转换为真正的数组
    toArray(ary, start, end) {
      if (start === undefined) start = 0;
      if (end === undefined) end = ary.length;
      return this.aproto().slice.call(ary, start, end);
    },

    // 根据文件大小返回格式化后的字符串，如 'KB'、'MB'、'GB'
    formatSize(size) {
      if (size < 1024) {
        return size.toFixed(0) + " bytes";
      } else if (size < 1024 * 1024) {
        return (size / 1024.0).toFixed(0) + " KB";
      } else if (size < 1024 * 1024 * 1024) {
        return (size / 1024.0 / 1024.0).toFixed(1) + " MB";
      } else {
        return (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + " GB";
      }
    },
  },
};