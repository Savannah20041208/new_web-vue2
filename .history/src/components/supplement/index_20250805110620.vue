<template>
  <div class="supplement-page">
    <el-container style="height: 100%">
      <el-header style="background-color: #f5f5f5; padding: 20px;">
        <h2>补录管理</h2>
        <p>在这里可以进行文件补录操作，支持直接上传和分片上传两种模式</p>
      </el-header>
      
      <el-main>
        <el-row :gutter="20">
          <!-- 左侧：上传配置 -->
          <el-col :span="8">
            <el-card class="config-card">
              <template v-slot:header>
                <div class="card-header">
                  <span>上传配置</span>
                </div>
              </template>
              
              <el-form :model="uploadConfig" label-width="120px">
                <el-form-item label="上传模式">
                  <el-radio-group v-model="uploadConfig.mode">
                    <el-radio label="auto">智能选择（≤5MB直接上传，>5MB分片上传）</el-radio>
                    <el-radio label="direct">直接上传</el-radio>
                    <el-radio label="chunk">分片上传</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="补录类型">
                  <el-select v-model="uploadConfig.supplementType" placeholder="请选择补录类型">
                    <el-option label="手动补录" value="manual"></el-option>
                    <el-option label="系统补录" value="system"></el-option>
                    <el-option label="批量补录" value="batch"></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item label="业务类型">
                  <el-select v-model="uploadConfig.businessType" placeholder="请选择业务类型">
                    <el-option label="文档补录" value="document"></el-option>
                    <el-option label="图片补录" value="image"></el-option>
                    <el-option label="视频补录" value="video"></el-option>
                    <el-option label="其他" value="other"></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item label="分片大小" v-if="uploadConfig.mode === 'chunk'">
                  <el-select v-model="uploadConfig.chunkSize">
                    <el-option label="1MB" :value="1024 * 1024"></el-option>
                    <el-option label="5MB" :value="5 * 1024 * 1024"></el-option>
                    <el-option label="10MB" :value="10 * 1024 * 1024"></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item label="并发数" v-if="uploadConfig.mode === 'chunk'">
                  <el-input-number v-model="uploadConfig.simultaneousUploads" :min="1" :max="10"></el-input-number>
                </el-form-item>
                
                <el-form-item label="备注">
                  <el-input v-model="uploadConfig.remark" type="textarea" :rows="3" placeholder="请输入备注信息"></el-input>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
          
          <!-- 中间：文件选择区域 -->
          <el-col :span="8">
            <el-card class="upload-card">
              <template v-slot:header>
                <div class="card-header">
                  <span>文件选择</span>
                </div>
              </template>
              
              <div class="upload-area" @click="selectFiles">
                <div class="upload-dragger">
                  <i class="el-icon-upload"></i>
                  <div class="upload-text">
                    <p>点击选择文件或拖拽文件到此处</p>
                    <p class="upload-tip">支持多文件上传</p>
                  </div>
                </div>
              </div>
              
              <input 
                ref="fileInput" 
                type="file" 
                multiple 
                style="display: none" 
                @change="handleFileSelect"
              />
              
              <!-- 已选文件列表 -->
              <div v-if="selectedFiles.length > 0" class="selected-files">
                <h4>已选文件 ({{ selectedFiles.length }})</h4>
                <ul class="file-list">
                  <li v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    <el-button type="text" @click="removeFile(index)">删除</el-button>
                  </li>
                </ul>
              </div>
              
              <div class="upload-actions">
                <el-button type="primary" @click="startUpload" :disabled="selectedFiles.length === 0">
                  开始上传
                </el-button>
                <el-button @click="clearFiles" :disabled="selectedFiles.length === 0">
                  清空文件
                </el-button>
              </div>
            </el-card>
          </el-col>
          
          <!-- 右侧：上传历史 -->
          <el-col :span="8">
            <el-card class="history-card">
              <template v-slot:header>
                <div class="card-header">
                  <span>上传历史</span>
                  <el-button type="text" @click="refreshHistory">刷新</el-button>
                </div>
              </template>
              
              <el-table :data="uploadHistory" style="width: 100%" max-height="400">
                <el-table-column prop="fileName" label="文件名" width="120" show-overflow-tooltip></el-table-column>
                <el-table-column prop="status" label="状态" width="80">
                  <template slot-scope="scope">
                    <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="uploadTime" label="上传时间" width="100"></el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'SupplementPage',
  data() {
    return {
      uploadConfig: {
        mode: 'supplement', // 补录页面固定使用补录模式
        supplementType: 'manual',
        businessType: 'document',
        chunkSize: 5 * 1024 * 1024,
        simultaneousUploads: 3,
        remark: ''
      },
      selectedFiles: [],
      uploadHistory: [
        { fileName: '示例文档.pdf', status: '成功', uploadTime: '2024-01-01' },
        { fileName: '测试图片.jpg', status: '失败', uploadTime: '2024-01-02' },
        { fileName: '数据文件.xlsx', status: '上传中', uploadTime: '2024-01-03' }
      ]
    }
  },
  methods: {
    // 选择文件
    selectFiles() {
      this.$refs.fileInput.click();
    },
    
    // 处理文件选择
    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      this.selectedFiles.push(...files);
      // 清空input，允许重复选择同一文件
      event.target.value = '';
    },
    
    // 移除文件
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },
    
    // 清空文件
    clearFiles() {
      this.selectedFiles = [];
    },
    
    // 开始上传
    startUpload() {
      if (this.selectedFiles.length === 0) {
        this.$message.warning('请先选择文件');
        return;
      }
      
      // 准备上传参数
      const params = {
        supplementType: this.uploadConfig.supplementType,
        businessType: this.uploadConfig.businessType,
        remark: this.uploadConfig.remark,
        uploadTime: new Date().toISOString()
      };
      
      // 准备上传选项
      const options = {
        uploadMode: this.uploadConfig.mode,
        chunkSize: this.uploadConfig.chunkSize,
        simultaneousUploads: this.uploadConfig.simultaneousUploads
      };
      
      // 调用全局上传组件
      this.$uploadBus.$emit('openUploader', {
        files: this.selectedFiles,
        params: params,
        options: options
      });
      
      this.$message.success('已添加到上传队列');
      
      // 清空已选文件
      this.clearFiles();
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 获取状态类型
    getStatusType(status) {
      switch (status) {
        case '成功': return 'success';
        case '失败': return 'danger';
        case '上传中': return 'warning';
        default: return 'info';
      }
    },
    
    // 刷新历史记录
    refreshHistory() {
      this.$message.info('刷新历史记录');
      // 这里可以调用API获取最新的上传历史
    }
  }
}
</script>

<style scoped>
.supplement-page {
  height: 100%;
  background-color: #f0f2f5;
}

.config-card, .upload-card, .history-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-dragger {
  background-color: #fafafa;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  box-sizing: border-box;
  width: 100%;
  height: 180px;
  text-align: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: border-color 0.3s;
}

.upload-dragger:hover {
  border-color: #409eff;
}

.upload-dragger i {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 0;
  color: #606266;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.selected-files {
  margin-bottom: 20px;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
}

.file-size {
  color: #909399;
  font-size: 12px;
  margin-right: 10px;
}

.upload-actions {
  text-align: center;
}
</style>
