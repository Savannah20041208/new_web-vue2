//const baseApi = 'http://192.168.210.132:9094';
//const token = '72dc09fc4a01c9bb0db39cc78d3f8cf9';//实时改动

// 使用代理路径避免CORS问题
const speedTestUrl = '/api/speed-test';//虚拟

async function testApiSpeed() {
  const startTime = performance.now();
  try {
    const response = await fetch(speedTestUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer 72dc09fc4a01c9bb0db39cc78d3f8cf9`  // 传递 Token
      },
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5秒超时
    });

    const endTime = performance.now();
    if (!response.ok) throw new Error(`测速失败: ${response.status}`);

    const latency = endTime - startTime;
    console.log(`API延迟: ${latency.toFixed(2)}ms`);

    // 延迟分为三类：返回 1、2、3
    let category;
    if (latency < 100) {
      category = 1; // 网络好
    } else if (latency < 200) {
      category = 2; // 网络一般
    } else {
      category = 3; // 网络差
    }

    console.log(`延迟类别: ${category}`);

    return latency;
  } catch (error) {
    console.error('测速失败:', error);
    return null;
  }
}

// 导出测速函数
export default testApiSpeed;