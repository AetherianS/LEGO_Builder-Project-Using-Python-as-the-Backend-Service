// 存储全局连接实例
let globalConnection = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 1000;

export const setupWebSocket = ({
    roomId,
    onOpen,
    onClose,
    onError,
    onMessage
}) => {
    // 如果已有连接且状态正常，则重用
    if (globalConnection &&
        globalConnection.roomId === roomId &&
        globalConnection.ws &&
        globalConnection.ws.readyState === WebSocket.OPEN) {
        console.log('重用现有 WebSocket 连接');
        return globalConnection;
    }

    // 如果有旧连接，先关闭
    if (globalConnection && globalConnection.ws) {
        console.log('关闭旧连接');
        try {
            // 标记为手动关闭，避免触发自动重连
            globalConnection.isManualClose = true;
            globalConnection.ws.close(1000, "Closing previous connection");
        } catch (e) {
            console.error('关闭旧连接时出错:', e);
        }
    }

    reconnectAttempts = 0;
    // 确定 WebSocket URL
    const wsHost = import.meta.env.VITE_WS_HOST || "localhost:8000";
    const wsUrl = `ws://${wsHost}/ws/${roomId}`;
    console.log(`创建新的 WebSocket 连接: ${wsUrl}`);

    // 创建 WebSocket 连接
    const ws = new WebSocket(wsUrl);

    // 标记连接状态
    let isManualClose = false;

    // 获取保存的用户数据
    const selfData = JSON.parse(localStorage.getItem('lego_builder_user') || '{}');

    const sendJoinMessage = () => {
        if (ws.readyState === WebSocket.OPEN && selfData && selfData.id) {
            console.log('发送JOIN消息:', selfData);
            ws.send(JSON.stringify({
                type: 'JOIN',
                data: selfData
            }));
        }
    };

    ws.onopen = () => {
        console.log('WebSocket 已连接!');
        reconnectAttempts = 0; // 重置重连次数

        // 连接成功后发送JOIN消息
        sendJoinMessage();

        if (onOpen) onOpen();
    };

    ws.onclose = (event) => {
        console.log('WebSocket 已关闭:', event.code, event.reason);

        // 通知关闭事件
        if (onClose) onClose();

        // 如果不是手动关闭且需要重连
        if (!isManualClose && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`尝试第 ${reconnectAttempts} 次重连...`);

            // 延迟重连
            setTimeout(() => {
                console.log('正在重连...');
                setupWebSocket({
                    roomId,
                    onOpen,
                    onClose,
                    onError,
                    onMessage
                });
            }, RECONNECT_DELAY);
        } else {
            // 重置全局连接
            globalConnection = null;
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        if (onError) onError(error);
    };

    ws.onmessage = (event) => {
        console.log('收到消息:', event.data);
        if (onMessage) onMessage(event.data);
    };

    // 创建一个控制对象
    const connection = {
        roomId,
        ws,
        isManualClose,
        sendUpdate: (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            } else if (ws.readyState === WebSocket.CONNECTING) {
                // 如果连接中，等待连接完成再发送
                ws.addEventListener('open', () => {
                    ws.send(JSON.stringify(data));
                }, { once: true });
            } else {
                console.warn('WebSocket 不在打开状态，无法发送消息');
            }
        },
        close: () => {
            isManualClose = true;
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close(1000, "Normal Closure");
            }
            globalConnection = null;
        }
    };

    // 保存为全局连接
    globalConnection = connection;

    return connection;
};
