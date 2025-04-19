/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import { useStore } from "../../store";

export function Others() {
  const others = useStore((state) => state.liveblocks.others);
  const room = useStore((state) => state.liveblocks.room);

  useEffect(() => {
    // 由于我们已经在 store 中处理了位置更新，这里不需要额外订阅
    // 但为了兼容原始代码，我们保留这个空的 useEffect
    const unsubscribe = room.subscribe(() => {
      // 不再需要做任何事情，因为位置更新已经通过 WebSocket 处理
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [room]);

  return (
    <>
      {others.map((other) => (
        <Other
          key={other.connectionId}
          id={other.connectionId}
          color={other.presence?.self?.color || "#ff0000"}
        />
      ))}
    </>
  );
}

function Other({ id, color }) {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const room = useStore((state) => state.liveblocks.room);

  useEffect(() => {
    // 监听特定用户ID的位置更新
    room.events.on(id, (newPosition) => {
      setPosition(newPosition);
    });
  }, [id, room.events]);

  return (
    <mesh position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
