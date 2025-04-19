import React, { useState } from 'react';
import { useStore } from '../../store';
import { addBrickByCoordinates, uID } from '../../utils/helpers';

export const BrickAdder = () => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0);
  const [width, setWidth] = useState(1);
  const [depth, setDepth] = useState(1);
  const [color, setColor] = useState('#ff0000');
  
  const setBricks = useStore((state) => state.setBricks);
  const bricks = useStore((state) => state.bricks);
  
  const handleAddBrick = () => {
    addBrickByCoordinates({
      coordinates: { x, y, z },
      dimensions: { x: width, z: depth },
      color,
      setBricks,
      bricks,
      uID
    });
  };
  
  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '10px' }}>
      <h3>添加积木</h3>
      <div style={{ marginBottom: '10px' }}>
        <label>X: </label>
        <input 
          type="number" 
          value={x} 
          onChange={(e) => setX(parseFloat(e.target.value))} 
          style={{ width: '60px', marginRight: '10px' }}
        />
        <label>Y: </label>
        <input 
          type="number" 
          value={y} 
          onChange={(e) => setY(parseFloat(e.target.value))} 
          style={{ width: '60px', marginRight: '10px' }}
        />
        <label>Z: </label>
        <input 
          type="number" 
          value={z} 
          onChange={(e) => setZ(parseFloat(e.target.value))} 
          style={{ width: '60px' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>宽度: </label>
        <input 
          type="number" 
          value={width} 
          onChange={(e) => setWidth(parseInt(e.target.value))} 
          min="1"
          style={{ width: '60px', marginRight: '10px' }}
        />
        <label>深度: </label>
        <input 
          type="number" 
          value={depth} 
          onChange={(e) => setDepth(parseInt(e.target.value))} 
          min="1"
          style={{ width: '60px' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>颜色: </label>
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)} 
          style={{ width: '60px', height: '30px' }}
        />
      </div>
      <button 
        onClick={handleAddBrick}
        style={{ 
          padding: '8px 16px', 
          background: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        添加积木
      </button>
    </div>
  );
}; 
