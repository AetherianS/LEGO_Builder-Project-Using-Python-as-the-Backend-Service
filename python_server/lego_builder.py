import requests
import json
from typing import Dict, List, Optional, Union, Any


class LegoBuilder:
    """
    Lego Builder API 客户端
    封装了对 Lego Builder 服务器 HTTP 接口的请求方法
    """
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        初始化 Lego Builder 客户端
        
        Args:
            base_url: API 服务器的基础 URL，默认为 http://localhost:8000
        """
        self.base_url = base_url.rstrip('/')
    
    def add_brick(self, room_id: str, x: float, y: float, z: float, 
                 dimensions_x: int, dimensions_z: int, 
                 color: str = "#ff0000", rotation: float = 0, 
                 translation_x: float = 0, translation_z: float = 0) -> Dict[str, Any]:
        """
        通过坐标添加积木到指定房间
        
        Args:
            room_id: 房间 ID
            x: 积木的 x 坐标
            y: 积木的 y 坐标
            z: 积木的 z 坐标
            dimensions_x: 积木的 x 维度，默认为 1
            dimensions_z: 积木的 z 维度，默认为 1
            color: 积木的颜色，默认为红色 (#ff0000)
            rotation: 积木的旋转角度，默认为 0
            translation_x: 积木的 x 平移，默认为 0
            translation_z: 积木的 z 平移，默认为 0
            
        Returns:
            包含添加积木结果的字典
        """
        url = f"{self.base_url}/api/bricks/add"
        
        # 构建请求参数
        params = {"room_id": room_id}
        
        # 构建积木数据，与 app.py 中的 BrickCoordinates 模型保持一致
        data = {
            "x": x,
            "y": y,
            "z": z,
            "dimensions_x": dimensions_x,
            "dimensions_z": dimensions_z,
            "color": color,
            "rotation": rotation,
            "translation_x": translation_x,
            "translation_z": translation_z
        }
        
        # 发送请求
        response = requests.post(url, params=params, json=data)
        
        # 检查响应状态
        response.raise_for_status()
        
        # 返回响应数据
        return response.json()
    
    def get_all_bricks(self, room_id: str) -> Dict[str, Any]:
        """
        获取指定房间内所有积木的详细信息
        
        Args:
            room_id: 房间 ID
            
        Returns:
            包含所有积木信息的字典
        """
        url = f"{self.base_url}/api/bricks/{room_id}"
        
        # 发送请求
        response = requests.get(url)
        
        # 检查响应状态
        response.raise_for_status()
        
        # 返回响应数据
        return response.json()
    
    def get_brick_by_id(self, room_id: str, brick_id: str) -> Dict[str, Any]:
        """
        通过积木ID获取特定积木的详细信息
        
        Args:
            room_id: 房间 ID
            brick_id: 积木 ID
            
        Returns:
            包含积木信息的字典
        """
        url = f"{self.base_url}/api/bricks/{room_id}/{brick_id}"
        
        # 发送请求
        response = requests.get(url)
        
        # 检查响应状态
        response.raise_for_status()
        
        # 返回响应数据
        return response.json()
    
    def delete_brick(self, room_id: str, brick_id: str) -> Dict[str, Any]:
        """
        通过积木ID删除特定积木
        
        Args:
            room_id: 房间 ID
            brick_id: 积木 ID
            
        Returns:
            包含删除结果的字典
        """
        url = f"{self.base_url}/api/bricks/{room_id}/{brick_id}"
        
        # 发送请求
        response = requests.delete(url)
        
        # 检查响应状态
        response.raise_for_status()
        
        # 返回响应数据
        return response.json()


# 使用示例
if __name__ == "__main__":
    # 创建 Lego Builder 客户端
    client = LegoBuilder()
    
    # 添加积木
    try:
        result = client.add_brick(
            room_id="123123",
            x=1,
            y=0,
            z=1,
            dimensions_x=2,
            dimensions_z=2,
            color="#00ff00",
        )
        result = client.add_brick(
            room_id="123123",
            x=1,
            y=1,
            z=1,
            dimensions_x=2,
            dimensions_z=2,
            color="#00ffff",
        )
        print("添加积木成功:", result)
        
        # 获取所有积木
        bricks = client.get_all_bricks("123123")
        print("所有积木:", bricks)
        
        # 如果有积木，获取第一个积木的详细信息
        if bricks["total_bricks"] > 0:
            brick_id = bricks["bricks"][0]["id"]
            brick = client.get_brick_by_id("123123", brick_id)
            print("积木详情:", brick)
            
            # 删除积木
            delete_result = client.delete_brick("123123", brick_id)
            print("删除积木结果:", delete_result)
    
    except requests.exceptions.HTTPError as e:
        print(f"HTTP 错误: {e}")
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
    except Exception as e:
        print(f"其他错误: {e}") 
