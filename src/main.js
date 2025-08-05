import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import "./assets/styles/reset.css";
<<<<<<< HEAD
=======
import ElButtonWithPermission from "@/components/permission/ElButtonWithPermission";
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc
import router from "./router";
import axios from "./api/mock";
import uploadBus from '@/components/x-upload/js/bus';

Vue.use(ElementUI, { size: "small" });
<<<<<<< HEAD
=======
Vue.component("el-button", ElButtonWithPermission); // 全局替换 el-button
>>>>>>> a93aa63421119dc40135dbf220ee2c0abd67bfdc
Vue.prototype.$axios = axios;
Vue.prototype.$uploadBus = uploadBus;

Vue.config.productionTip = false
Vue.config.devtools = true

new Vue({
  el: '#app',
  router,
  render: h => h(App)
});
