const { defineConfig } = require('@vue/cli-service')


// 原始后端地址
// const baseApi = 'http://192.168.210.132:9094';

// 本地开发使用mock服务器
const baseApi = 'http://localhost:3000';



module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    open: false,
    host: '0.0.0.0',
    port: 8082,
    https: false,
    // 暂时禁用代理，避免连接错误
    // proxy: {
    //   '/api/': {
    //     target: `${baseApi}`,
    //     changeOrigin: true,
    //     pathRewrite: {
    //       '^/api': '/api',
    //     },
    //   },
    // }
  }
})
