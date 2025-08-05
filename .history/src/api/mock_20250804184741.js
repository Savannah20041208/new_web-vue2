import axios from "axios";

// 创建axios实例
const instance = axios.create({
  timeout: 10000,
});

// 添加请求拦截器，模拟API响应
instance.interceptors.request.use(
  (config) => {
    console.log('API请求:', config.method?.toUpperCase(), config.url, config.data);

    // 模拟文件上传相关的API响应
    if (config.url?.includes('/api/fileUploadTask')) {
      return Promise.reject({
        response: {
          status: 200,
          data: mockApiResponse(config.url, config.method, config.data)
        }
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 如果是我们模拟的响应，直接返回数据
    if (error.response && error.response.status === 200) {
      console.log('Mock API响应:', error.response.data);
      return Promise.resolve(error.response);
    }

    console.error('API错误:', error);
    return Promise.reject(error);
  }
);

// Mock API响应函数
function mockApiResponse(url, method, data) {
  console.log('Mock API调用:', method, url, data);

  // 分片检查接口
  if (method === 'GET' && url.includes('/api/fileUploadTask/')) {
    return {
      code: "200",
      state: "00000",
      message: "分片检查成功",
      data: {
        exitPartList: JSON.stringify([]) // 空数组表示没有已上传的分片
      }
    };
  }

  // 分片上传接口
  if (method === 'POST' && url.includes('/api/fileUploadTask/upload')) {
    return {
      code: "200",
      state: "00000",
      message: "分片上传成功",
      data: {
        partNumber: data?.get?.('partNumber') || 1,
        uploaded: true
      }
    };
  }

  // 直接上传接口
  if (method === 'POST' && url.includes('/api/fileUploadTask/directUpload')) {
    return {
      code: "200",
      state: "00000",
      message: "直接上传成功",
      data: {
        fileId: 'mock_file_' + Date.now(),
        fileName: data?.get?.('fileName') || 'unknown',
        fileSize: data?.get?.('fileSize') || 0,
        uploadTime: new Date().toISOString()
      }
    };
  }

  // 补录上传接口
  if (method === 'POST' && url.includes('/api/fileUploadTask/supplementUpload')) {
    return {
      code: "200",
      state: "00000",
      message: "补录上传成功",
      data: {
        fileId: 'supplement_' + Date.now(),
        fileName: data?.get?.('fileName') || 'unknown',
        supplementType: data?.get?.('supplementType') || 'manual',
        uploadTime: new Date().toISOString()
      }
    };
  }

  // 初始化任务接口
  if (method === 'POST' && url.includes('/api/fileUploadTask/initTask')) {
    return {
      code: "200",
      state: "00000",
      message: "任务初始化成功",
      data: {
        taskId: 'task_' + Date.now(),
        uploadUrl: '/api/fileUploadTask/upload'
      }
    };
  }

  // 默认响应
  return {
    code: "200",
    state: "00000",
    message: "操作成功",
    data: {}
  };
}

// 导出axios实例
export default instance;
