import json
import uuid
from typing import Dict, List, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# 添加 CORS 中间件以允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为实际的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 储存所有房间的状态
rooms: Dict[str, Dict] = {}
# 储存每个房间的连接
room_connections: Dict[str, Dict[str, WebSocket]] = {}

# 添加新的数据模型
class BrickCoordinates(BaseModel):
    x: float
    y: float
    z: float
    dimensions_x: int = 1
    dimensions_z: int = 1
    color: str = "#ff0000"
    rotation: float = 0
    translation_x: float = 0
    translation_z: float = 0

class WebSocketManager:
    def __init__(self):
        # 保存活跃的房间
        self.active_rooms: Dict[str, Dict[str, WebSocket]] = {}
        # 用户ID到房间ID的映射，方便快速查找
        self.user_room_map: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, user_data: Dict):
        # 接受 WebSocket 连接
        await websocket.accept()
        
        # 检查用户是否已在房间中（可能是重连）
        existing_user_id = None
        for uid, conn in self.active_rooms.get(room_id, {}).items():
            try:
                # 尝试发送心跳检测消息
                await conn.send_text(json.dumps({"type": "PING"}))
            except Exception:
                # 如果发送失败，标记为需要替换的旧连接
                existing_user_id = uid
                break
        
        # 如果找到同一房间的相同或死亡连接，先移除
        if existing_user_id:
            print(f"替换房间 {room_id} 中的旧连接: {existing_user_id}")
            await self.disconnect(existing_user_id)
        
        # 创建房间（如果不存在）
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = {}
            rooms[room_id] = {
                "bricks": [],
                "cursorColors": {}
            }
        
        # 保存用户连接
        self.active_rooms[room_id][user_id] = websocket
        self.user_room_map[user_id] = room_id
        
        # 更新房间中的光标颜色
        if user_data and "color" in user_data:
            rooms[room_id]["cursorColors"][user_id] = user_data.get("color")
        
        # 发送当前房间状态给新用户
        await self.send_personal_message(
            json.dumps({"type": "ROOM_STATE", "data": rooms[room_id]}),
            websocket
        )
        
        # 通知房间内其他用户有新用户加入
        await self.broadcast(
            room_id,
            json.dumps({"type": "USER_JOINED", "data": {"id": user_id, "color": user_data.get("color", "#ff0000")}}),
            exclude_user_id=user_id
        )

    async def disconnect(self, user_id: str):
        room_id = self.user_room_map.get(user_id)
        if not room_id:
            return
        
        # 从房间中移除用户连接
        if room_id in self.active_rooms and user_id in self.active_rooms[room_id]:
            del self.active_rooms[room_id][user_id]
            print(f"用户 {user_id} 已从房间 {room_id} 中断开连接")
        
        # 从用户-房间映射中移除
        if user_id in self.user_room_map:
            del self.user_room_map[user_id]
        
        # 从房间状态中移除用户光标颜色
        if (room_id in rooms and 
            "cursorColors" in rooms[room_id] and 
            user_id in rooms[room_id]["cursorColors"]):
            del rooms[room_id]["cursorColors"][user_id]
            
            # 通知房间内其他用户该用户已离开
            await self.broadcast(
                room_id,
                json.dumps({"type": "USER_LEFT", "data": {"id": user_id}}),
            )
        
        # 如果房间为空，清理房间
        if room_id in self.active_rooms and not self.active_rooms[room_id]:
            del self.active_rooms[room_id]
            if room_id in rooms:
                del rooms[room_id]
                print(f"房间 {room_id} 已清理（无用户）")

    async def broadcast(self, room_id: str, message: str, exclude_user_id: str = None):
        if room_id not in self.active_rooms:
            return
        
        # 给房间内所有用户发送消息，除了可能被排除的用户
        print(f"active_rooms: {self.active_rooms}")
        for uid, connection in self.active_rooms[room_id].items():
            if exclude_user_id and uid == exclude_user_id:
                continue
            await self.send_personal_message(message, connection)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        # 检查 websocket 是否还处于活跃状态
        try:
            await websocket.send_text(message)
        except RuntimeError as e:
            print(f"无法发送消息: {e}")
            # 查找并移除此连接
            user_to_remove = None
            room_to_check = None
            
            for room_id, connections in list(self.active_rooms.items()):
                for uid, conn in connections.items():
                    if conn == websocket:
                        user_to_remove = uid
                        room_to_check = room_id
                        break
                if user_to_remove:
                    break
            
            if user_to_remove and room_to_check:
                print(f"移除失效连接: {user_to_remove} 从房间 {room_to_check}")
                await self.disconnect(user_to_remove)

    async def handle_message(self, message_text: str, user_id: str):
        try:
            message = json.loads(message_text)
            room_id = self.user_room_map.get(user_id)
            
            if not room_id or room_id not in rooms:
                return
            
            message_type = message.get("type")
            data = message.get("data")
            
            if message_type == "UPDATE_BRICKS":
                # 更新砖块数据
                rooms[room_id]["bricks"] = data
                # 向发送者发送确认消息
                await self.send_personal_message(
                    json.dumps({"type": "BRICK_ADDED", "data": {"status": "success"}}),
                    self.active_rooms[room_id][user_id]
                )
                # 广播给其他用户
                await self.broadcast(
                    room_id,
                    json.dumps({"type": "UPDATE_BRICKS", "data": data}),
                    exclude_user_id=user_id
                )
            elif message_type == "CLEAR_BRICKS":
                # 清空砖块数据
                rooms[room_id]["bricks"] = []
                # 向发送者发送确认消息
                await self.send_personal_message(
                    json.dumps({"type": "BRICKS_CLEARED", "data": {"status": "success"}}),
                    self.active_rooms[room_id][user_id]
                )
                # 广播给其他用户
                await self.broadcast(
                    room_id,
                    json.dumps({"type": "UPDATE_BRICKS", "data": []}),
                    exclude_user_id=user_id
                )
            elif message_type == "UPDATE_SELF":
                # 更新用户信息
                user_color = data.get("color")
                if user_color:
                    rooms[room_id]["cursorColors"][user_id] = user_color
                    await self.broadcast(
                        room_id,
                        json.dumps({"type": "USER_JOINED", "data": {"id": user_id, "color": user_color}}),
                        exclude_user_id=user_id
                    )
            elif message_type == "UPDATE_CURSORS":
                # 更新光标颜色
                rooms[room_id]["cursorColors"].update(data)
                await self.broadcast(
                    room_id,
                    json.dumps({"type": "UPDATE_CURSORS", "data": data}),
                    exclude_user_id=user_id
                )
            elif message_type == "USER_CURSOR":
                # 转发光标位置信息
                await self.broadcast(
                    room_id,
                    json.dumps({"type": "USER_CURSOR", "data": data}),
                    exclude_user_id=user_id
                )
                
        except json.JSONDecodeError:
            print(f"Invalid JSON message: {message_text}")
        except Exception as e:
            print(f"Error handling message: {str(e)}")


# 创建 WebSocket 管理器实例
manager = WebSocketManager()

@app.get("/")
async def get():
    return {"message": "Lego Builder WebSocket Server"}


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    # 生成唯一用户ID
    user_id = str(uuid.uuid4())
    
    # 默认用户数据
    user_data = {"color": "#" + "%06x" % (hash(user_id) % 0xFFFFFF)}
    
    # 连接
    await manager.connect(websocket, room_id, user_id, user_data)
    
    try:
        while True:
            # 等待接收消息
            message = await websocket.receive_text()
            await manager.handle_message(message, user_id)
    except WebSocketDisconnect:
        # 处理断开连接
        await manager.disconnect(user_id)
    except Exception as e:
        print(f"Error in WebSocket connection: {str(e)}")
        await manager.disconnect(user_id)


@app.post("/api/bricks/add")
async def add_brick(room_id: str, brick: BrickCoordinates):
    """
    通过坐标添加积木到指定房间
    """
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # 创建积木数据
    brick_data = {
        "intersect": {
            "point": {  #针对坐标系进行初步标准化，将坐标定位在网格上
                "x": -(12.5+(-brick.x-1)*25),
                "y": brick.y*35,
                "z": -(12.5+(brick.z-1)*25)
            },
            "face": {
                "a": 0,
                "b": 2,
                "c": 1,
                "normal": {"x": 0, "y": 0, "z": 1},
                "materialIndex": 0
            }
        },
        "uID": str(uuid.uuid4())[:8],
        "dimensions": {
            "x": brick.dimensions_x,
            "z": brick.dimensions_z
        },
        "rotation": brick.rotation,
        "color": brick.color,
        "translation": {
            "x": brick.translation_x,
            "z": brick.translation_z
        }
    }
    
    # 更新房间中的积木数据
    rooms[room_id]["bricks"].append(brick_data)
    
    # 广播给房间内所有用户
    await manager.broadcast(
        room_id,
        json.dumps({"type": "UPDATE_BRICKS", "data": rooms[room_id]["bricks"]})
    )
    
    return {"status": "success", "data": brick_data}


@app.get("/api/bricks/{room_id}")
async def get_all_bricks(room_id: str):
    """
    获取指定房间内所有积木的详细信息
    """
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    bricks = rooms[room_id]["bricks"]
    
    # 为每个积木添加序号
    bricks_with_index = []
    for i, brick in enumerate(bricks):
        brick_info = {
            "index": i + 1,  # 从1开始的序号
            "id": brick["uID"],
            "position": {
                "x": brick["intersect"]["point"]["x"],
                "y": brick["intersect"]["point"]["y"],
                "z": brick["intersect"]["point"]["z"]
            },
            "dimensions": {
                "x": brick["dimensions"]["x"],
                "z": brick["dimensions"]["z"]
            },
            "color": brick["color"],
            "rotation": brick["rotation"],
            "translation": brick["translation"],
            "raw_data": brick  # 包含完整的原始数据结构
        }
        bricks_with_index.append(brick_info)
    
    return {
        "status": "success",
        "room_id": room_id,
        "total_bricks": len(bricks),
        "bricks": bricks_with_index
    }


@app.get("/api/bricks/{room_id}/{brick_id}")
async def get_brick_by_id(room_id: str, brick_id: str):
    """
    通过积木ID获取特定积木的详细信息
    """
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    bricks = rooms[room_id]["bricks"]
    
    # 查找指定ID的积木
    for i, brick in enumerate(bricks):
        if brick["uID"] == brick_id:
            brick_info = {
                "index": i + 1,  # 从1开始的序号
                "id": brick["uID"],
                "position": {
                    "x": brick["intersect"]["point"]["x"],
                    "y": brick["intersect"]["point"]["y"],
                    "z": brick["intersect"]["point"]["z"]
                },
                "dimensions": {
                    "x": brick["dimensions"]["x"],
                    "z": brick["dimensions"]["z"]
                },
                "color": brick["color"],
                "rotation": brick["rotation"],
                "translation": brick["translation"],
                "raw_data": brick  # 包含完整的原始数据结构
            }
            return {
                "status": "success",
                "room_id": room_id,
                "brick": brick_info
            }
    
    # 如果未找到指定ID的积木
    raise HTTPException(status_code=404, detail="Brick not found")


@app.delete("/api/bricks/{room_id}/{brick_id}")
async def delete_brick(room_id: str, brick_id: str):
    """
    通过积木ID删除特定积木
    """
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    bricks = rooms[room_id]["bricks"]
    
    # 查找并删除指定ID的积木
    for i, brick in enumerate(bricks):
        if brick["uID"] == brick_id:
            # 保存积木信息用于返回
            deleted_brick = brick
            
            # 从列表中删除积木
            rooms[room_id]["bricks"].pop(i)
            
            # 广播给房间内所有用户
            await manager.broadcast(
                room_id,
                json.dumps({"type": "UPDATE_BRICKS", "data": rooms[room_id]["bricks"]})
            )
            
            return {
                "status": "success",
                "message": f"Brick {brick_id} deleted successfully",
                "deleted_brick": deleted_brick
            }
    
    # 如果未找到指定ID的积木
    raise HTTPException(status_code=404, detail="Brick not found")


if __name__ == "__main__":
    print("start")
    import uvicorn
    # 启动服务器
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
