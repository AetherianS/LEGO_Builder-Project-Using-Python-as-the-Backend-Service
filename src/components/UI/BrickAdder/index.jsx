import React, { useState } from 'react';
import { useStore } from '../../../store';
import { addBrickByCoordinates } from '../../../utils/helpers';
import './styles.css';

export const BrickAdder = () => {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [dimensions, setDimensions] = useState({ width: 1, depth: 1 });
  const [color, setColor] = useState('#ff0000');
  
  const setBricks = useStore((state) => state.setBricks);
  const bricks = useStore((state) => state.bricks);
  const uID = useStore((state) => state.uID);

  const handleAddBrick = () => {
    addBrickByCoordinates({
      coordinates: position,
      dimensions,
      color,
      setBricks,
      bricks,
      uID
    });
  };

  return (
    <div className="brick-adder">
      <h3>通过坐标添加积木</h3>
      <div className="input-group">
        <label>X 坐标:</label>
        <input
          type="number"
          value={position.x}
          onChange={(e) => setPosition({ ...position, x: Number(e.target.value) })}
        />
      </div>
      <div className="input-group">
        <label>Y 坐标:</label>
        <input
          type="number"
          value={position.y}
          onChange={(e) => setPosition({ ...position, y: Number(e.target.value) })}
        />
      </div>
      <div className="input-group">
        <label>Z 坐标:</label>
        <input
          type="number"
          value={position.z}
          onChange={(e) => setPosition({ ...position, z: Number(e.target.value) })}
        />
      </div>
      <div className="input-group">
        <label>宽度:</label>
        <input
          type="number"
          min="1"
          max="5"
          value={dimensions.width}
          onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
        />
      </div>
      <div className="input-group">
        <label>深度:</label>
        <input
          type="number"
          min="1"
          max="5"
          value={dimensions.depth}
          onChange={(e) => setDimensions({ ...dimensions, depth: Number(e.target.value) })}
        />
      </div>
      <div className="input-group">
        <label>颜色:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <button onClick={handleAddBrick}>添加积木</button>
    </div>
  );
}; 
