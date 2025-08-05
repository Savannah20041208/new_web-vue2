export const utils = {
  data() {
    return {
      i: 0,
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
