import { create } from "zustand";
import {
  CREATE_MODE,
  defaultAnchor,
  defaultWidth,
  generateSoftColors,
  uID,
} from "../utils";
import { setupWebSocket } from "../services/websocket";

const id = uID();
const color = generateSoftColors();

// 创建基础 store
const createBaseStore = (set, get) => ({
  mode: CREATE_MODE,
  setMode: (newMode) => set({ mode: newMode }),

  width: defaultWidth,
  setWidth: (newWidth) => set({ width: newWidth }),

  depth: defaultWidth,
  setDepth: (newDepth) => set({ depth: newDepth }),

  anchorX: defaultAnchor,
  setAnchorX: (newAnchorPoint) => set({ anchorX: newAnchorPoint }),

  anchorZ: defaultAnchor,
  setAnchorZ: (newAnchorPoint) => set({ anchorZ: newAnchorPoint }),

  rotate: false,
  setRotate: (bool) => set({ rotate: bool }),

  color: "#ff0000",
  setColor: (newColor) => set({ color: newColor }),

  selectedBricks: [],
  setSelectedBricks: ({ object, shift }) =>
    set((state) => {
      if (object === undefined) return { selectedBricks: [] };
      else if (Array.isArray(object)) return { selectedBricks: object };
      else if (!shift)
        return state.selectedBricks[0] === object
          ? { selectedBricks: [] }
          : { selectedBricks: [object] };
      else if (state.selectedBricks.includes(object))
        return {
          selectedBricks: state.selectedBricks.filter((o) => o !== object),
        };
      else return { selectedBricks: [object, ...state.selectedBricks] };
    }),

  bricks: [],
  setBricks: (getBricks) => {
    console.log("store/setBricks", getBricks);
    const newBricks = getBricks(get().bricks);
    // 发送更新到服务器
    get().wsConnection?.sendUpdate({ type: "UPDATE_BRICKS", data: newBricks });
    return set({ bricks: newBricks });
  },
  clearBricks: () => {
    get().wsConnection?.sendUpdate({ type: "CLEAR_BRICKS", data: [] });
    set({ bricks: [] });
  },

  self: { id: id, color: color, name: `User-${id.substring(0, 5)}` },
  setSelfName: (name) => {
    const newSelf = { ...get().self, name };
    get().wsConnection?.sendUpdate({ type: "UPDATE_SELF", data: newSelf });
    set({ self: newSelf });
  },

  cursorColors: {},
  setCursorColors: (newCursorColor) => {
    const updatedColors = { ...get().cursorColors, ...newCursorColor };
    get().wsConnection?.sendUpdate({ type: "UPDATE_CURSORS", data: updatedColors });
    set({ cursorColors: updatedColors });
  },

  removeCursorColor: (id) => {
    const updatedColors = { ...get().cursorColors };
    delete updatedColors[id];
    get().wsConnection?.sendUpdate({ type: "UPDATE_CURSORS", data: updatedColors });
    set({ cursorColors: updatedColors });
  },

  // WebSocket 连接和状态
  wsConnection: null,
  roomId: null, // 房间ID
  connected: false,
  connecting: false,
  error: null,

  // 连接方法
  connect: (roomId) => {
    // 如果已经连接到这个房间，不要再创建新连接
    if (get().roomId === roomId && (get().connected || get().connecting)) {
      return;
    }

    set({ connecting: true, roomId });

    // 保存用户信息到本地存储
    localStorage.setItem('lego_builder_user', JSON.stringify(get().self));

    const wsConnection = setupWebSocket({
      roomId,
      onOpen: () => {
        set({ connected: true, connecting: false, error: null });
      },
      onClose: () => {
        set({ connected: false, connecting: false });
      },
      onError: (error) => {
        set({ error: error.message || '连接错误', connected: false, connecting: false });
      },
      onMessage: (message) => {
        try {
          const { type, data } = JSON.parse(message);
          console.log('收到消息', type, data);

          switch (type) {
            case "ROOM_STATE":
              // 收到房间的完整状态
              set({
                bricks: data.bricks || [],
                cursorColors: data.cursorColors || {},
                connected: true,   // 确保设置为已连接
                connecting: false,
                error: null
              });
              break;
            case "UPDATE_BRICKS":
              // 收到砖块更新
              set({ bricks: data });
              break;
            case "BRICK_ADDED":
              // 收到添加砖块确认
              console.log('砖块添加成功');
              break;
            case "BRICKS_CLEARED":
              // 收到清空砖块确认
              console.log('砖块清空成功');
              break;
            case "USER_JOINED":
              // 新用户加入
              set(state => ({
                cursorColors: { ...state.cursorColors, [data.id]: data.color }
              }));
              break;
            case "USER_LEFT":
              // 用户离开
              set(state => {
                const updatedColors = { ...state.cursorColors };
                delete updatedColors[data.id];
                return { cursorColors: updatedColors };
              });
              break;
            case "USER_CURSOR":
              // 用户光标移动
              if (get().room) {
                get().room.events.emit(data.id, data.position);
              }
              break;
          }
        } catch (e) {
          console.error("Failed to parse message", e);
        }
      }
    });

    set({ wsConnection });
  },

  disconnect: () => {
    const { wsConnection } = get();
    if (wsConnection) {
      wsConnection.close();
    }
    set({ wsConnection: null, connected: false, roomId: null });
  },

  // 用于兼容现有代码的 room 对象
  room: {
    broadcastEvent: (event) => {
      const { wsConnection } = get();
      if (wsConnection) {
        wsConnection.sendUpdate({
          type: "USER_CURSOR",
          data: {
            id: get().self.id,
            position: event.data
          }
        });
      }
    },
    events: {
      callbacks: {},
      on: function (eventName, callback) {
        if (!this.callbacks[eventName]) {
          this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
      },
      emit: function (eventName, data) {
        const callbacks = this.callbacks[eventName] || [];
        callbacks.forEach(callback => callback(data));
      }
    },
    // 添加 subscribe 方法来兼容 Others.jsx
    subscribe: function (callback) {
      // 监听数据变化
      const unsubscribe = () => {
        // 取消订阅的逻辑
        console.log("取消订阅位置更新");
      };

      // 返回取消订阅函数
      return unsubscribe;
    }
  },

  // 为了兼容现有代码的 liveblocks 属性
  liveblocks: {
    get room() {
      return get().room;
    },
    enterRoom: (roomId) => {
      get().connect(roomId);
      return {
        status: get().connected ? "connected" : get().connecting ? "connecting" : "disconnected",
      };
    },
    leaveRoom: () => {
      get().disconnect();
    },
    get status() {
      return get().connected ? "connected" : get().connecting ? "connecting" : "disconnected";
    },
    get others() {
      // 将 cursorColors 转换为符合现有代码期望的 others 数组格式
      const selfId = get().self.id;
      return Object.entries(get().cursorColors)
        .filter(([id]) => id !== selfId)
        .map(([id, color]) => ({
          connectionId: id,
          presence: {
            self: {
              id,
              color,
              name: `User-${id.substring(0, 5)}`,  // 默认名称格式
            }
          }
        }));
    }
  }
});

export const useStore = create((set, get) => createBaseStore(set, get));
