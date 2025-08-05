import Vue from 'vue'
import VueRouter from "vue-router";

import XUpload from "@/components/x-upload/index.vue";
import XUpload1 from "@/components/x-upload/components/folder-drag-upload/index.vue";
import Supplement from "@/components/supplement/index.vue";

Vue.use(VueRouter);

const routes = [
  // 这里可以添加路由配置
  {
    path: "/permission",
    name: "Permission",
    component: Permission,
  },
  {
    path: "/xupload",
    name: "XUpload",
    component: XUpload,
  },
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
