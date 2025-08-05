<template>
  <div id="app" style="height: 100vh">
    <router-view></router-view>

    <x-upload />
  </div>
</template>

<script>
import XUpload from "@/components/x-upload";

export default {
  name: "App",
  components: {
    XUpload
  },
};
</script>
