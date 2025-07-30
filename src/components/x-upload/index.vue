<template>
  <div id="global-uploader" v-show="panelShow" v-drag :class="{ 'global-uploader-single': !global }">
    <input type="file" multiple @change="handleFileChange" style="display: none;" />

    <div class="uploader-app">
      <div class="file-panel" :class="{ collapse: collapse }">
        <div class="file-title">
          <div class="title">文件列表</div>
          <div class="operate">
            <el-button @click="collapse = !collapse" type="text" :title="collapse ? '展开' : '折叠'">
              <i class="iconfont" :class="collapse ? 'el-icon-full-screen' : 'el-icon-minus'"></i>
            </el-button>
            <el-button @click="panelShow = false" type="text" title="关闭">
              <i class="el-icon-close"></i>
            </el-button>
          </div>
        </div>
 
        <template v-if="!support">
          <div class="uploader-unsupport" style="padding: 10px">
            <slot>
              <p>
                <span>很遗憾，您的浏览器不支持该功能。该功能需要支持</span>
                <a href="http://www.w3.org/TR/FileAPI/">HTML5 文件 API</a>
                <span>以及</span>
                <a href="http://www.w3.org/TR/FileAPI/#normalization-of-params">
                  文件切片
                </a>
                <span>。</span>
              </p>
            </slot>
          </div>
        </template>

        <template v-else>
          <ul class="file-list">
            <li class="file-item" v-for="file in files" :key="file.id">
              <x-file :class="['file_' + file.id]" :file="file"></x-file>
            </li>
            <div class="no-file" v-if="!files.length">
              <i class="iconfont icon-empty-file"></i>
              暂无待上传文件
            </div>
          </ul>
          <div v-if="files.length" style="
              display: flex;
              flex-direction: row;
              justify-content: flex-end;
              padding: 5px;
              border-top: 1px solid #e2e2e2;
            ">
            <el-button size="mini" style="padding: 5px 10px" @click="allRemove">
              全部取消
            </el-button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import SparkMD5 from "spark-md5";
import { file } from "./file.js";
import { chunk } from "./chunk.js";
import { utils } from "./utils.js";
import { uploader } from "./uploader.js";
import XFile from "./components/x-file.vue";
import Bus from './js/bus'

// eslint-disable-next-line
import drag from './js/drag';

var token = "87362b4e4ab1abed34a7153e3bab18ce";

export default {
  name: "XUpload",
  mixins: [utils, uploader, file, chunk],
  components: {
    XFile,
  },
  props: {
    global: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      opts: {
        target: (file, chunk) => {
          // 分片检查请求
          if (this.opts.testChunks && !chunk.tested) {
            return `api/fileUploadTask/${file.uniqueIdentifier}`;
          }
          // 分片上传请求
          return `api/fileUploadTask/upload`;
        }, // 上传地址
        // 根据文件大小和网络条件动态调整分片大小
        chunkSize: 5 * 1024 * 1024,
        forceChunkSize: true,
        // 动态并发数 - 根据网络状况自动调整
        simultaneousUploads: 4, // 默认值，实际会动态调整


        checkChunkUploadedByResponse: (chunk, message) => {
          console.log("checkChunkUploadedByResponse", chunk, message);

          let skip = false;

          try {
            let objMessage = JSON.parse(message);
            if (objMessage.data) {
              const exitPartList = JSON.parse(objMessage.data.exitPartList);
              const partNumberList = exitPartList.map(
                (message) => message.partNumber,
              );
              skip = (partNumberList || []).indexOf(chunk.offset + 1) >= 0;
            }
          } catch (e) {
            console.error("checkChunkUploadedByResponse error:", e);
            skip = false;
          }

          return skip;
        }, // 是否根据服务器响应来检查分片是否已上传
        initialPaused: false, // 是否在初始化时暂停上传
        testChunks: true, // 是否在初始化时测试分片是否已上传
        testMethod: "GET", // 测试分片是否已上传的请求方法
        uploadMethod: "POST", // 上传分片的请求方法
        fileParameterName: "chunk", // 文件参数名
        successStatuses: [200, 201, 202], // 成功状态码
        successApiStatuses: {
          code: "200", // 成功状态码
          state: "00000",
        }, // 成功状态码
        permanentErrors: [404, 415, 500, 501], // 错误状态码
        preprocess: null, // 预处理函数，用于修改文件对象
        progressCallbacksInterval: 200, // 进度回调函数的间隔时间，单位为毫秒
        speedSmoothingFactor: 0.1, // 速度平滑因子，用于计算平均速度
        maxChunkRetries: 1, // 最大重试次数
        chunkRetryInterval: 1000, // 重试间隔时间，单位为毫秒
        initTask: (file, message) => {
          // 初始化任务函数，用于初始化任务
          console.log("initTask", file, message);
          return new Promise((resolve, reject) => {
            // 请求 /api/fileUploadTask/initTask 接口
            try {
              let objMessage = JSON.parse(message);
              if (!objMessage.data) {
                this.$axios
                  .post(
                    "/api/fileUploadTask/initTask",
                    {
                      fileName: file.name,
                      totalSize: file.size,
                      lastModified: file.lastModified,
                      chunkSize: this.opts.chunkSize,
                      identifier: file.uniqueIdentifier,
                    },
                    {
                      headers: {
                        authorization: token,
                      },
                    },
                  )
                  .then((response) => {
                    // 处理接口响应
                    if (response.status === 200) {
                      resolve({
                        ...file.params,
                        identifier: file.uniqueIdentifier,
                      });
                    } else {
                      reject(new Error("初始化任务失败"));
                    }
                  })
                  .catch((error) => {
                    console.error("初始化任务请求出错:", error);
                    reject(error);
                  });
              } else {
                resolve();
              }
            } catch (e) {
              reject(e);
            }
          });
        },
        headers: {
          // 请求头
          authorization: token,
        },
        query: (file, chunk, isTest) => {
          // 上传参数预处理方法
          console.log("上传参数预处理方法", file, chunk, isTest);
          // 返回上传参数
          return {
            ...file.params,
          };
        },
        processParams: (params, file, chunk, isTest) => {
          //自定义每一次分片传给后台的参数，params是该方法返回的形参，包含分片信息,
          //若不自定义则默认会把文件所有参数传给后台，自己可以通过接口查看插件本身传递的参数
          console.log("上传参数处理方法", params, file, chunk, isTest);
          if (isTest) return {};

          return {
            identifier: params.identifier,
            partNumber: params.chunkNumber,
          };
        },
        processResponse: (res, cb) => {
          // 处理服务器响应函数，用于解析服务器响应数据
          let message = res;
          try {
            message = JSON.parse(res);
          } catch (e) {
            console.log(e);
          }
          cb(null, message);
        },
      },

      panelShow: false,
      collapse: false,
    };
  },

  methods: {
    // 处理文件选择事件
    async initializeUploadConfig() {
      // 检测网络速度
      const networkSpeed = await this.detectNetworkSpeed();

      // 根据网络状况调整并发数
      this.opts.simultaneousUploads = this.getOptimalConcurrency(networkSpeed);

      console.log(`网络速度: ${networkSpeed}, 并发数设置为: ${this.opts.simultaneousUploads}`);
    },

    handleFileChange(e) {
      // console.log('文件已选择', e.target.files);
      // 处理文件变化的逻辑
      this.addFiles(e.target.files);
    },

    // 上传队列添加完毕，开始上传逻辑
    onFileAdded(file) {
      this.panelShow = true;

      // 根据文件大小动态调整分片大小
      const optimalChunkSize = this.getOptimalChunkSize(file.size);
      console.log(`文件大小: ${this.formatSize(file.size)}, 分片大小设置为: ${this.formatSize(optimalChunkSize)}`);

      // 更新当前文件的分片大小配置
      this.opts.chunkSize = optimalChunkSize;

      // 重新初始化文件分片（因为分片大小可能已改变）
      this.bootstrap(file);

      // 自定义文件预处理逻辑，如添加自定义属性等
      this.computeMD5(file).then((result) => this.startUpload(result));
    },

    // 网络状况变化时重新配置
    onNetworkChanged(networkSpeed) {
      const newConcurrency = this.getOptimalConcurrency(networkSpeed);
      this.opts.simultaneousUploads = newConcurrency;
      console.log(`网络变化，并发数调整为: ${newConcurrency}`);

      // 如果有正在上传的文件，可以考虑重新调整上传策略
      this.files.forEach(file => {
        if (file.isUploading()) {
          // 可以在这里实现动态调整正在上传文件的策略
          console.log(`正在调整文件 ${file.name} 的上传策略`);
        }
      });
    },




    // 计算文件的MD5值
    computeMD5(file) {
      let fileReader = new FileReader();
      let time = new Date().getTime();
      let blobSlice =
        File.prototype.slice ||
        File.prototype.mozSlice ||
        File.prototype.webkitSlice;
      let currentChunk = 0;
      const chunkSize = this.opts.chunkSize;
      let chunks = Math.ceil(file.size / chunkSize);
      let spark = new SparkMD5.ArrayBuffer();

      // 文件状态设为"计算MD5"
      if (document.querySelector(`.file_${file.id}`)) {
        this.statusSet(file.id, "md5");
      }

      loadNext();

      return new Promise((resolve, reject) => {
        fileReader.onload = (e) => {
          spark.append(e.target.result);

          if (currentChunk < chunks) {
            currentChunk++;
            loadNext();

            // 实时展示MD5的计算进度
            this.$nextTick(() => {
              const statusEl = document.querySelector(
                `.custom-status-${file.id}`,
              );
              if (statusEl) {
                const md5ProgressText =
                  "校验MD5 " + ((currentChunk / chunks) * 100).toFixed(0) + "%";
                statusEl.innerText = md5ProgressText;
              }
            });
          } else {
            let md5 = spark.end();
            // 处理自定义MD5附加参数
            md5 = md5 + "_" +"1949709482170777600";
            // md5计算完毕
            resolve({ md5, file });

            console.log(
              `MD5计算完毕：${file.name} \nMD5：${md5} \n分片：${chunks} 大小:${file.size
              } 用时：${new Date().getTime() - time} ms`,
            );
          }
        };

        fileReader.onerror = () => {
          this.$emit("error", `文件${file.name}读取出错，请检查该文件`);
          file.cancel();
          reject();
        };
      });

      function loadNext() {
        // 如果文件已被删除,直接返回
        if (!file.file) {
          return;
        }

        let start = currentChunk * chunkSize;
        let end =
          start + chunkSize >= file.size ? file.size : start + chunkSize;

        fileReader.readAsArrayBuffer(blobSlice.call(file.file, start, end));
      }
    },

    // 自定义文件状态
    statusSet(id, status) {
      let statusMap = {
        md5: {
          text: "校验MD5",
          bgc: "#fff",
        },
        merging: {
          text: "合并中",
          bgc: "#e2eeff",
        },
        failed: {
          text: "上传失败",
          bgc: "#e2eeff",
        },
        mergerr: {
          text: "合并失败",
          bgc: "#e2eeff",
        },
      };

      this.$nextTick(() => {
        const statusWrap = document.querySelector(
          `.file_${id} .uploader-file-status`,
        );
        if (statusWrap) {
          const statusTag = document.createElement("span");
          statusTag.className = `custom-status-${id} custom-status`;
          statusTag.innerText = statusMap[status].text;
          statusTag.style.backgroundColor = statusMap[status].bgc;
          statusWrap.appendChild(statusTag);
        }
      });
    },

    // 移除自定义标识
    statusRemove(id) {
      this.customStatus = "";
      this.$nextTick(() => {
        const statusTag = document.querySelector(`.custom-status-${id}`);
        if (statusTag) {
          statusTag.remove();
        }
      });
    },

    // 开始逻辑上传
    startUpload({ md5, file }) {
      // console.log('逻辑上传', file, md5);
      // 设置文件的唯一标识符
      file.uniqueIdentifier = md5;
      // 移除自定义标识
      this.statusRemove(file.id);
      // 开始上传
      file.upload();
    },

    // 开始上传回调
    uploadStart() {
      console.log("开始上传了");
    },

    // 上传完成
    complete(file) {
      console.log("上传完成了", file);
    },

    fileProgress(file, chunk) {
      console.log(
        `上传中 ${file.name}，chunk：${chunk.startByte / 1024 / 1024} ~ ${chunk.endByte / 1024 / 1024
        }`,
      );
    },

    fileSuccess(file, response, chunk) {
      console.log("fileSuccess", file, response, chunk);

      if (file.progress() === 1) {
        // 文件状态设为“合并中”
        this.statusSet(file.id, "merging");

        this.$axios
          .post(
            "/api/fileUploadTask/merge/" + file.uniqueIdentifier,
            {},
            {
              headers: {
                authorization: token,
              },
            },
          )
          .then((response) => {
            console.log("合并成功", response);
            this.emit("onFileSuccess");
            this.statusRemove(file.id);
          })
          .catch((error) => {
            console.log("合并失败", error);
            this.statusSet(file.id, "mergerr");
          });

        // 不需要合并
      } else {
        this.emit("onFileSuccess");
        console.log("上传成功");
      }
    },

    fileError(file, response, chunk) {
      console.log("文件上传失败详情:", {
        file: file.name,
        response: response,
        chunk: chunk,
        chunkNumber: chunk ? chunk.offset + 1 : 'unknown',
        xhr: chunk ? chunk.xhr : null
      });
      this.error(response);
    },

    fileRetry(file, chunk) {
      console.log("文件上传重试", file, chunk);
    },

    fileRemoved(file) {
      console.log("文件被删除", file);
    },

    allRemove() {
      for (const file of this.files) {
        file.cancel();
      }
    },

    error(msg) {
      this.$notify({
        title: "错误",
        message: msg,
        type: "error",
        duration: 2000,
      });
    },

    emit(e) {
      Bus.$emit(e);
      this.$emit(e);
    },
  },

  async mounted() {
    // 组件挂载时初始化配置
    await this.initializeUploadConfig();

    // 开始监听网络状态变化
    this.monitorNetworkStatus();

    // 监听网络变化事件
    this.$on('network-changed', this.onNetworkChanged);

    // 现有的Bus监听
    Bus.$on('openUploader', ({ files = [], params = {}, options = {} }) => {
      console.log('openUploader', files, params, options);
      this.addFiles(files);
    });
  },

  beforeDestroy() {
    // 清理事件监听
    this.$off('network-changed', this.onNetworkChanged);
  }
};

</script>

<style>
.custom-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  font-size: 12px;
  font-weight: bold;
}
</style>

<style lang="scss" scoped>
#global-uploader {
  &:not(.global-uploader-single) {
    position: fixed;
    z-index: 20;
    right: 15px;
    bottom: 15px;
    box-sizing: border-box;
  }

  .uploader-app {
    width: 520px;
    position: relative;
  }

  .file-panel {
    background-color: #fff;
    border: 1px solid #e2e2e2;
    border-radius: 7px 7px 0 0;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);

    .file-title {
      display: flex;
      height: 40px;
      line-height: 40px;
      padding: 0 15px;
      border-bottom: 1px solid #ddd;

      .operate {
        flex: 1;
        text-align: right;

        i {
          font-size: 18px;
        }
      }
    }

    .file-list {
      position: relative;
      height: 240px;
      overflow-x: hidden;
      overflow-y: auto;
      background-color: #fff;
      transition: all 0.3s;

      .file-item {
        background-color: #fff;
      }
    }

    &.collapse {
      .file-title {
        background-color: #e7ecf2;
      }

      .file-list {
        height: 0;
      }
    }

    .no-file {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 16px;
    }
  }
}
</style>
