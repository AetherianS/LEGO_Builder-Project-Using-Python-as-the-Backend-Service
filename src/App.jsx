/* eslint-disable react/prop-types */
import "./App.css";
import { useEffect, useState } from "react";
import { LegoRoom } from "./components/3D";
import { useStore } from "./store";
import { Loader } from "./components/UI/Loader";
import { JoinRoomScreen } from "./components/UI/JoinRoomForm";

const CONNECTED = "connected";

const Lobby = ({ roomId }) => {
  const enterRoom = useStore((state) => state.liveblocks.enterRoom);
  const leaveRoom = useStore((state) => state.liveblocks.leaveRoom);
  const status = useStore((state) => state.connected ? CONNECTED : state.connecting ? "connecting" : "disconnected");

  // 使用 useEffect 处理连接，避免重复连接
  useEffect(() => {
    console.log('Lobby组件挂载，尝试连接房间:', roomId);
    enterRoom(roomId);

    // 清理函数只在组件真正卸载时执行
    return () => {
      console.log('Lobby组件卸载，断开连接');
      leaveRoom();
    };
  }, [enterRoom, leaveRoom, roomId]); // 移除wsConnection依赖，以避免重复连接

  if (status !== CONNECTED) {
    return <Loader status={status} />;
  }

  return <LegoRoom />;
};

function App() {
  const [roomId, setRoomId] = useState(null);

  return (
    <div className="App">
      {
        roomId ? (
          <Lobby roomId={roomId} />
        ) : (
          <JoinRoomScreen setRoomId={setRoomId} />
        )
      }
    </div >
  );
}

export default App;
