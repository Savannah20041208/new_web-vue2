<template>
  <div id="app" style="height: 100vh">
    <navigation />
    <div class="main-content">
      <router-view></router-view>
    </div>

    <x-upload ref="globalUploader" />
  </div>
</template>

<script>
import XUpload from "@/components/x-upload";
import Navigation from "@/components/navigation";

export default {
  name: "App",
  components: {
    XUpload
  },
  methods: {
    // 导出单独文件->url，通过标识返回不同的值
    exportFileUrl(identifier, type = 'default') {
      const baseUrl = 'api/fileUploadTask';

      switch (type) {
        case 'check':
          // 分片检查请求
          return `${baseUrl}/${identifier}`;
        case 'upload':
          // 分片上传请求
          return `${baseUrl}/upload`;
        case 'direct':
          // 直接上传（不分片）
          return `${baseUrl}/directUpload`;
        case 'supplement':
          // 补录上传
          return `${baseUrl}/supplementUpload`;
        default:
          return `${baseUrl}/upload`;
      }
    },

    // 获取全局上传器实例
    getGlobalUploader() {
      return this.$refs.globalUploader;
    }
  },
  mounted() {
    // 将导出方法挂载到全局，方便其他组件调用
    this.$root.exportFileUrl = this.exportFileUrl;
    this.$root.getGlobalUploader = this.getGlobalUploader;
  }
};
</script>
