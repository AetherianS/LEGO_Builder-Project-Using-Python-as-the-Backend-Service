from lego_builder import LegoBuilder

def create_heart_shape(room_id: str = "heart-room", base_color: str = "#ff0000"):
    client = LegoBuilder()  # 默认连接到localhost:8000
    
    # 定义心形坐标点 (x, z)，假设y固定为0，每个积木尺寸为1x1
    heart_coords = [
        # 上半部分（圆润的左右半圆）
        # 左半圆（x负，z负表示向上）
        (-3, -4), (-4, -3), (-5, -2), (-4, -1), (-3, 0), 
        (-2, -5), (-1, -6), (0, -7), 
        # 右半圆（x正，z负表示向上）
        (3, -4), (4, -3), (5, -2), (4, -1), (3, 0), 
        (2, -5), (1, -6), (0, -7),
        # 下半部分（平滑的倒V形）
        (-2, 2), (-1, 3), (0, 4), (1, 3), (2, 2),
        (-1, 1), (0, 2), (1, 1), 
        (0, 0)  # 中心点
    ]
    
    # 添加积木
    for x, z in heart_coords:
        try:
            result = client.add_brick(
                room_id=room_id,
                x=float(x),
                y=0.0,          # 假设y轴高度固定为0（平面心形）
                z=float(z),
                dimensions_x=1, # 积木长宽为1单位
                dimensions_z=1,
                color=base_color
            )
            print(f"添加积木 ({x}, {z}) 成功: {result}")
        except Exception as e:
            print(f"添加积木 ({x}, {z}) 失败: {str(e)}")

if __name__ == "__main__":
    create_heart_shape(base_color="#FF69B4")  # 使用粉色心形
