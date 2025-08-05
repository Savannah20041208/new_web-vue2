<template>
  <div class="navigation">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      @select="handleSelect"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
    >
      <el-menu-item index="/">
        <i class="el-icon-upload"></i>
        文件上传
      </el-menu-item>
      <el-menu-item index="/supplement">
        <i class="el-icon-document-add"></i>
        补录管理
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script>
export default {
  name: 'AppNavigation',
  data() {
    return {
      activeIndex: '/'
    }
  },
  methods: {
    handleSelect(key) {
      this.activeIndex = key;
      // 避免重复导航到当前路由
      if (this.$route.path !== key) {
        this.$router.push(key);
      }
    }
  },
  watch: {
    '$route'(to) {
      this.activeIndex = to.path;
    }
  },
  mounted() {
    this.activeIndex = this.$route.path;
  }
}
</script>

<style scoped>
.navigation {
  width: 100%;
}

.el-menu-demo {
  border-bottom: none;
}
</style>
