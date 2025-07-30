<template>
  <el-container style="height: 100%">
    <el-main>
      <el-row :gutter="20" style="height: 100%">
        <el-col :span="8">
          <div class="grid-content bg-purple-light">
            <el-card class="box-card">
              <template v-slot:header>
                <div class="clearfix">
                  <span>正常渲染</span>
                </div>
              </template>

              <pre>
	<code class="language-js line-numbers" v-text="code1"></code>
</pre>

              <el-button-group>
                <el-button>默认按钮</el-button>
                <el-button type="primary">主要按钮</el-button>
                <el-button type="success">成功按钮</el-button>
                <el-button type="info">信息按钮</el-button>
                <el-button type="warning">警告按钮</el-button>
                <el-button type="danger">危险按钮</el-button>
              </el-button-group>

              <el-divider></el-divider>

              <el-alert title="无指令正常显示" type="warning"></el-alert>
            </el-card>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="grid-content bg-purple-light">
            <el-card class="box-card">
              <template v-slot:header>
                <div class="clearfix">
                  <span>全局el-button组件继承扩展</span>
                </div>
              </template>

              <pre>
				<code class="language-js line-numbers" v-text="code2"></code>
			</pre>

              <el-button-group>
                <el-button>默认按钮</el-button>
                <el-button type="primary" :permission="['primary']"
                  >主要按钮</el-button
                >
                <el-button type="success" :permission="['success']"
                  >成功按钮</el-button
                >
                <el-button type="info" permission="info">信息按钮</el-button>
                <el-button type="warning" permission="warning"
                  >警告按钮</el-button
                >
                <el-button type="danger">危险按钮</el-button>
              </el-button-group>

              <el-divider></el-divider>

              <el-alert
                title="采用全局继承el-button拓展方式阻断渲染，提升性能"
                type="warning"
              ></el-alert>
            </el-card>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="grid-content bg-purple-light">
            <el-card class="box-card">
              <template v-slot:header>
                <div class="clearfix">
                  <span>自定义指令非el-button使用</span>
                </div>
              </template>

              <pre>
				<code class="language-js line-numbers" v-text="code3"></code>
			</pre>

              <el-button-group>
                <el-button>默认按钮</el-button>
                <el-button type="primary" v-permission="['primary']"
                  >主要按钮</el-button
                >
                <el-button type="success" v-permission="['success']"
                  >成功按钮</el-button
                >
                <el-button type="info" v-permission="'info'"
                  >信息按钮</el-button
                >
                <el-button type="warning" v-permission="'warning'"
                  >警告按钮</el-button
                >
                <el-button type="danger">危险按钮</el-button>
              </el-button-group>

              <el-divider></el-divider>

              <el-alert
                title="非el-button元素使用自定义指令方式，渲染完成后剔除元素"
                type="warning"
              ></el-alert>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import Prism from "prismjs";
export default {
  name: "permission-index",
  data() {
    return {
      code1: `<el-button-group>
		<el-button>默认按钮</el-button>
		<el-button type="primary">主要按钮</el-button>
		<el-button type="success">成功按钮</el-button>
		<el-button type="info">信息按钮</el-button>
		<el-button type="warning">警告按钮</el-button>
		<el-button type="danger">危险按钮</el-button>
	</el-button-group>`,
      code2: `<el-button-group>
					<el-button>默认按钮</el-button>
					<el-button type="primary" :permission="['primary']">主要按钮</el-button>
					<el-button type="success" :permission="['success']">成功按钮</el-button>
					<el-button type="info" permission="info">信息按钮</el-button>
					<el-button type="warning" permission="warning">警告按钮</el-button>
					<el-button type="danger">危险按钮</el-button>
				</el-button-group>`,
      code3: `<el-button-group>
					<el-button>默认按钮</el-button>
					<el-button type="primary" v-permission="['primary']">主要按钮</el-button>
					<el-button type="success" v-permission="['success']">成功按钮</el-button>
					<el-button type="info" v-permission="'info'">信息按钮</el-button>
					<el-button type="warning" v-permission="'warning'">警告按钮</el-button>
					<el-button type="danger">危险按钮</el-button>
				</el-button-group>`,
    };
  },
  methods: {
    // 这里可以添加组件的方法
  },
  mounted() {
    Prism.highlightAll(); // 代码高亮
  },
  created() {
    // 这里可以添加组件的初始化操作
    console.log("11111111111111");
  },
};
</script>

<style scoped>
.el-col {
  height: 100%;
  border-radius: 4px;
}

.bg-purple-dark {
  background: #99a9bf;
}

.bg-purple {
  height: 100%;
  background: #d3dce6;
}

.bg-purple-light {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e9f2;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}

.row-bg {
  padding: 10px 0;
  background-color: #f9fafc;
}

.el-card {
  width: 100%;
  height: 100%;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}

.clearfix:after {
  clear: both;
}

.box-card {
  background-color: #e5e9f2 !important;
}

.el-card__header {
  border-bottom: 3px solid #ebeef5 !important;
}

.el-card__body {
  padding: 12px !important;
  /* height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e9f2; */
}

pre {
  height: 195px;
}
</style>
