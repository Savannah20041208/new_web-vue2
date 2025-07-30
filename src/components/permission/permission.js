import Vue from "vue/dist/vue.esm.js";

Vue.directive("permission", {
  inserted(el, binding, vnode) {
    console.log(vnode);

    const { value } = binding; // 获取指令的值，即权限标识
    // const permissions = vnode.context.$store.getters.permissions; // 从 Vuex 中获取权限列表
    const permissions = ["primary", "warning"];

    // 判断是否有权限
    const hasPermission = Array.isArray(value)
      ? value.some((permission) => permissions.includes(permission)) // 如果 value 是数组，检查是否有任意一个权限
      : permissions.includes(value); // 如果 value 是字符串，检查是否有该权限

    // 如果没有权限，移除按钮
    if (!hasPermission) {
      el.parentNode && el.parentNode.removeChild(el);
    }
  },
});
