/**
 * 天地图API代理服务器（Node.js + Express）
 * 
 * 使用方法：
 * 1. 安装依赖：npm install express
 * 2. 运行：node proxy-server.js
 * 3. 确保前端代码中的 TDT_SEARCH_API 指向代理地址（如："/api/tdt-search" 或 "http://localhost:3000/api/tdt-search"）
 * 
 * 注意：如果使用相对路径 "/api/tdt-search"，需要确保前端页面和代理服务器在同一域名下
 */

const express = require('express');
const fetch = require('node-fetch'); // Node.js < 18 需要安装：npm install node-fetch@2
const app = express();
const PORT = 3000;

// 允许跨域（如果前端和代理不在同一域名）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// 解析JSON请求体（如果需要POST方式）
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 代理天地图搜索API
 * GET /api/tdt-search?postStr={...}&type=query&tk=...
 */
app.get('/api/tdt-search', async (req, res) => {
  try {
    const { postStr, type, tk } = req.query;
    
    // 参数验证
    if (!postStr || !type || !tk) {
      return res.status(400).json({ 
        error: '缺少必要参数',
        required: ['postStr', 'type', 'tk']
      });
    }
    
    // 构建天地图API URL
    const tdtUrl = `https://api.tianditu.gov.cn/v2/search?postStr=${encodeURIComponent(postStr)}&type=${type}&tk=${tk}`;
    
    console.log('[代理请求]', tdtUrl);
    
    // 转发请求到天地图API
    const response = await fetch(tdtUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://api.tianditu.gov.cn/',
        'Origin': 'https://api.tianditu.gov.cn'
      }
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[代理错误]', response.status, errorText);
      return res.status(response.status).json({ 
        error: '天地图API请求失败',
        status: response.status,
        message: errorText
      });
    }
    
    // 获取响应数据
    const data = await response.json();
    
    // 返回JSON数据
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(data);
    
    console.log('[代理成功]', '返回数据条数:', data.pois ? data.pois.length : 0);
    
  } catch (error) {
    console.error('[代理异常]', error);
    res.status(500).json({ 
      error: '代理请求失败',
      message: error.message 
    });
  }
});

/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '代理服务器运行正常' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`天地图API代理服务器已启动`);
  console.log(`监听端口: ${PORT}`);
  console.log(`代理地址: http://localhost:${PORT}/api/tdt-search`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log('========================================');
  console.log('提示：确保前端代码中的 TDT_SEARCH_API 指向此代理地址');
  console.log('========================================');
});

