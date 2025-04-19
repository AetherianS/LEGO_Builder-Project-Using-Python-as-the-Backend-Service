import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// 移除严格模式，避免组件重复挂载导致的多次连接问题
ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>  // 暂时注释
  <App />
  // </React.StrictMode>  // 暂时注释
)
