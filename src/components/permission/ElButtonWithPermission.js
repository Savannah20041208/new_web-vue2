import { Button } from "element-ui";
import "./permission";

export default {
  name: "ElButton",
  extends: Button, // 继承 el-button
  props: {
    permission: {
      type: [String, Array],
      default: "",
    },
  },
  computed: {
    hasPermission() {
      // const permissions = this.$store.getters.permissions;
      const permissions = ["primary", "info"];

      if (Array.isArray(this.permission)) {
        return this.permission.every((p) => permissions.includes(p));
      }
      return !this.permission || permissions.includes(this.permission);
    },
  },
  render(h) {
    if (this.hasPermission) {
      return h(
        Button,
        {
          ...this.$vnode.data, // 包含原生属性和事件监听器
          props: {
            ...this.$props, // 合并组件的 props
            ...this.$vnode.data.props, // 保留 $vnode.data 中的 props（如果有）
          },
          attrs: {
            ...this.$attrs, // 合并未被声明为 props 的属性
            ...this.$vnode.data.attrs, // 保留 $vnode.data 中的 attrs（如果有）
          },
          on: {
            ...this.$listeners, // 合并事件监听器
            ...this.$vnode.data.on, // 保留 $vnode.data 中的事件监听器（如果有）
          },
          scopedSlots: this.$scopedSlots, // 传递作用域插槽
          key: this.$vnode.key, // 保留 key
          ref: this.$vnode.ref, // 保留 ref
          refInFor: this.$vnode.refInFor, // 保留 refInFor
        },
        this.$slots.default,
      );
    }
    return null; // 如果没有权限，直接返回 null，阻断渲染
  },
};
