# Lego Builder 项目

## 项目概述

Lego Builder 是一个基于 Web 的 3D 积木构建应用，允许用户在虚拟环境中创建和操作积木模型。项目采用前后端分离架构，前端使用 React 和 Three.js 实现 3D 渲染，后端使用 FastAPI 提供 API 服务和 WebSocket 实时通信。

## 技术栈

### 前端
- **React**: 用于构建用户界面
- **Three.js**: 用于 3D 渲染
- **React Three Fiber**: Three.js 的 React 封装
- **React Three Drei**: Three.js 的实用工具集合
- **Zustand**: 状态管理
- **Vite**: 构建工具

### 后端
- **FastAPI**: Python Web 框架
- **WebSockets**: 实时通信
- **Pydantic**: 数据验证
- **Uvicorn**: ASGI 服务器

## 项目结构

```
lego-builder/
├── src/                  # 前端源代码
│   ├── components/       # React 组件
│   ├── store/            # Zustand 状态管理
│   ├── services/         # 服务层
│   ├── utils/            # 工具函数
│   ├── App.jsx           # 主应用组件
│   ├── main.jsx          # 入口文件
│   └── websocket.js      # WebSocket 客户端
├── python_server/        # 后端源代码
│   ├── app.py            # FastAPI 应用
│   ├── lego_builder.py   # API 客户端封装
│   └── requirements.txt  # Python 依赖
├── public/               # 静态资源
├── index.html            # HTML 入口
├── package.json          # 前端依赖
└── vite.config.js        # Vite 配置
```

## 安装与运行

### 前端设置

1. 安装 Node.js 依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm run dev
```

前端应用将在 http://localhost:5173 运行。

### 后端设置

1. 创建并激活 Python 虚拟环境：

```bash
cd python_server
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

2. 安装 Python 依赖：

```bash
pip install -r requirements.txt
```

3. 启动 FastAPI 服务器：

```bash
python app.py
```

后端服务将在 http://localhost:8000 运行。

## API 文档

FastAPI 自动生成的 API 文档可在以下地址访问：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 客户端

项目提供了一个 Python API 客户端 `lego_builder.py`，封装了对后端 API 的调用。使用示例：

```python
from lego_builder import LegoBuilder

# 创建客户端
client = LegoBuilder()

# 添加积木
result = client.add_brick(
    room_id="room1",
    x=1.0,
    y=2.0,
    z=3.0,
    dimensions_x=2,
    dimensions_z=2,
    color="#00ff00"
)

# 获取所有积木
bricks = client.get_all_bricks("room1")

# 获取特定积木
brick = client.get_brick_by_id("room1", "brick-id")

# 删除积木
delete_result = client.delete_brick("room1", "brick-id")
```

## API 端点

### 积木操作

- `POST /api/bricks/add`: 添加积木
- `GET /api/bricks/{room_id}`: 获取房间内所有积木
- `GET /api/bricks/{room_id}/{brick_id}`: 获取特定积木
- `DELETE /api/bricks/{room_id}/{brick_id}`: 删除积木

### WebSocket

- `WS /ws/{room_id}`: 连接到房间的 WebSocket 端点

## 实时协作

项目支持通过 WebSocket 实现实时协作，多个用户可以同时编辑同一个房间的积木模型，所有更改会实时同步到所有连接的客户端。

## 开发注意事项

1. 确保前端和后端服务同时运行
2. 前端默认连接到 http://localhost:8000 的后端服务
3. 如需修改连接地址，请更新 `src/websocket.js` 和 `python_server/lego_builder.py` 中的相关配置
