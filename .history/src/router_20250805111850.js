import Vue from 'vue'
import VueRouter from "vue-router";

import XUpload1 from "@/components/x-upload/components/folder-drag-upload/index.vue";
import Supplement from "@/components/supplement/index.vue";

Vue.use(VueRouter);

const routes = [
  // 这里可以添加路由配置
  {
    path: "/supplement",
    name: "Supplement",
    component: Supplement,
  },
  {
    path: "/",
    name: "FolderDragUpload",
    component: XUpload1,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
