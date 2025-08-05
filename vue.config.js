const { defineConfig } = require('@vue/cli-service')


const baseApi = 'http://192.168.210.132:9094';



module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    open: false,
    host: '0.0.0.0',
    port: 8082,
    https: false,
    proxy: {
      '/api/': {
        target: `${baseApi}`,
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api',
        },
      },
    }
  }
})
