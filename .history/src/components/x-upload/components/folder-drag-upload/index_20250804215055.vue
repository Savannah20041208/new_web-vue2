<template>
  <div class="folder-drag-upload">
    <div class="upload-dragger" :class="{
      'is-dragover': dragover
    }" @click="onClick" @drop.prevent="onDrop" @dragover.prevent="onDragover" @dragleave.prevent="onDragleave">
      <slot>
        <template v-if="files.length === 0">
          <div class="upload__svg">
            <svg t="1649654296943" class="icon" viewBox="0 0 1170 1024" version="1.1" p-id="2203" width="67"
              height="67">
              <path
                d="M877.714286 512a73.142857 73.142857 0 0 1-73.142857 73.142857h-438.857143A73.142857 73.142857 0 0 1 292.571429 512 73.142857 73.142857 0 0 0 219.428571 438.857143h-146.285714A73.142857 73.142857 0 0 0 0 512V877.714286a146.285714 146.285714 0 0 0 146.285714 146.285714h877.714286a146.285714 146.285714 0 0 0 146.285714-146.285714v-365.714286A73.142857 73.142857 0 0 0 1097.142857 438.857143h-146.285714a73.142857 73.142857 0 0 0-73.142857 73.142857z"
                fill="#66b1ff" p-id="2204"></path>
              <path
                d="M560.761905 950.857143a48.761905 48.761905 0 0 0 48.761905-48.761905V585.142857h-97.52381v316.952381a48.761905 48.761905 0 0 0 48.761905 48.761905z"
                fill="#66b1ff" p-id="2205"></path>
              <path
                d="M402.285714 222.841905h109.714286a24.380952 24.380952 0 0 1 24.380952 24.380952V877.714286a48.761905 48.761905 0 0 0 97.52381 0V247.222857a24.380952 24.380952 0 0 1 24.380952-24.380952h109.714286a24.380952 24.380952 0 0 0 16.579048-41.935238L601.721905 6.826667a24.380952 24.380952 0 0 0-33.645715 0L385.219048 180.906667a24.380952 24.380952 0 0 0 17.066666 41.935238z"
                fill="#66b1ff" p-id="2206"></path>
            </svg>
          </div>
          <div class="upload__text">将文件夹或文件拖拽到此处，或<em>点击上传</em></div>
        </template>
        <template v-else>
          <el-table :data="Array.from(files)" height="100%" style="width: 100%" show-summary sum-text="共计"
            :summary-method="filesNUM">
            <el-table-column type="index" width="50"></el-table-column>
            <el-table-column prop="webkitRelativePath,fullPath" label="Name">
              <template slot-scope="scope">
                {{ scope.row.webkitRelativePath || scope.row.fullPath || scope.row.name }}
              </template>
            </el-table-column>
            <el-table-column prop="size" label="Size" width="150px">
              <template slot-scope="scope">
                {{ formatSize(scope.row.size) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template slot="header">
                <el-button-group>
                  <el-button size="mini" type="danger" plain icon="el-icon-close"
                    @click.stop="clearFiles">清空</el-button>
                  <el-button size="mini" type="primary" plain @click.stop="submitFiles">
                    提交
                    <i class="el-icon-upload2 el-icon--right"></i>
                  </el-button>
                </el-button-group>
              </template>
              <template slot-scope="scope">
                <el-button size="mini" type="text" @click.stop="removeFile(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </slot>
    </div>
    <input ref="input" type="file" name="file" class="upload__input" @change="inputChange" multiple />
  </div>
</template>

<script>
export default {
  name: 'FolderDragUpload',
  data() {
    return {
      dragover: false,
      files: []
    }
  },
  methods: {
    getFiles() {
      return this.files
    },
    onClick() {
      this.$refs.input.click()
    },
    inputChange() {
      const { files } = this.$refs.input
      if (files.length) this.files.push(...files)
    },
    clearFiles() {
      this.files = []
    },
    submitFiles() {
      this.$uploadBus.$emit('openUploader', {
        files: this.files,
        params: {},
        options: {
          uploadMode: 'auto' // 使用自动模式，根据文件大小智能选择上传方式
        }
      })
    },
    onDragover(e) {
      e.preventDefault()
      this.dragover = true
    },
    onDragleave(e) {
      e.preventDefault()
      this.dragover = false
    },
    onDrop(e) {
      e.preventDefault();
      this.dragover = false;
      const { items } = e.dataTransfer;
      console.log(items);
      for (let i = 0; i <= items.length - 1; i++) {
        let item = items[i];
        if (item.kind === 'file') {
          let entry = item.webkitGetAsEntry();
          if (entry) {
            if (entry.isFile) {
              entry.file((file) => {
                Object.defineProperty(file, 'webkitRelativePath', { writable: true });
                file.webkitRelativePath = entry.fullPath.slice(1);
                this.files.push(file);
              });
            } else if (entry.isDirectory) {
              let dirReader = entry.createReader();
              dirReader.readEntries((entries) => {
                entries.forEach((item) => this.getFileFromEntryRecursively(item));
              });
            }
          }
        }
      }
    },
    //获取文件夹下的所有文件
    getFileFromEntryRecursively(entry) {
      if (entry.isFile) {
        // 是文件
        entry.file((file) => {
          // 获取文件成功
          Object.defineProperty(file, 'webkitRelativePath', {
            writable: true //设置属性为可写
          })
          file.webkitRelativePath = entry.fullPath.slice(1)
          this.files.push(file)
        })
      } else if (entry.isDirectory) {
        // 是文件夹
        let dirReader = entry.createReader()
        dirReader.readEntries((entries) => {
          entries.forEach((item) => this.getFileFromEntryRecursively(item))
        })
      }
    },
    // 文件大小转换字节
    formatSize(size) {
      if (size < 1024) {
        return size + 'B'
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + 'KB'
      } else if (size < 1024 * 1024 * 1024) {
        return (size / 1024 / 1024).toFixed(2) + 'MB'
      } else {
        return (size / 1024 / 1024 / 1024).toFixed(2) + 'GB'
      }
    },
    // 共计文件个数
    filesNUM(params) {
      const { columns, data } = params
      let sum = []
      columns.forEach((item, index) => {
        if (index === 0) return (sum[index] = '共计')
        if (index === columns.length - 1) return (sum[index] = data.length + '个文件')
      })
      return sum
    },
    removeFile(index) {
      this.files.splice(index, 1);
    },
  }
}
</script>

<style lang="scss">
.folder-drag-upload {
  height: 100%;

  .upload-dragger {
    background-color: #fff;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    min-height: 180px;
    height: 100%;
    text-align: center;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &:hover {
      cursor: pointer;
      border: 1px dashed #66b1ff;
    }

    .el-icon-upload {
      font-size: 67px;
      color: #c0c4cc;
      margin: 40px 0 16px;
      line-height: 50px;
    }

    .upload__svg {
      padding: 40px 0 16px;
    }

    .upload__text {
      em {
        color: #66b1ff;
      }
    }
  }

  .tip_container {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-top: 7px;
    color: #606266;
 
    .upload__tip {
      flex: 1;
    }

    .upload__clear { 
      color: #f56c6c;
    }
  }

  .upload__input {
    display: none;
  }

  .is-dragover {
    background-color: rgba(32, 159, 255, 0.06);
    border: 2px dashed #409eff;
  }
}
</style>