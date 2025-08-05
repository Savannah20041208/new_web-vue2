import Vue from 'vue'
import VueRouter from "vue-router";

<<<<<<< HEAD
import XUpload1 from "@/components/x-upload/components/folder-drag-upload/index.vue";
import Supplement from "@/components/supplement/index.vue";
=======
import Permission from "@/components/permission/index.vue";
import XUpload from "@/components/x-upload/index.vue";
import XUpload1 from "@/components/x-upload/components/folder-drag-upload/index.vue";
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc

Vue.use(VueRouter);

const routes = [
  // 这里可以添加路由配置
  {
<<<<<<< HEAD
    path: "/supplement",
    name: "Supplement",
    component: Supplement,
=======
    path: "/permission",
    name: "Permission",
    component: Permission,
  },
  {
    path: "/xupload",
    name: "XUpload",
    component: XUpload,
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc
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
