const WS_RECONNECT_DELAY = 3000; // 重连延迟时间，毫秒

export const setupWebSocket = ({
    roomId,
    onOpen,
    onClose,
    onError,
    onMessage
}) => {
    // 确定 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_HOST || window.location.host;
    const wsUrl = `${protocol}//${host}/ws/${roomId}`;

    console.log(`正在连接 WebSocket: ${wsUrl}`);

    // 创建 WebSocket 连接
    const ws = new WebSocket(wsUrl);
    let reconnectTimer = null;
    let isIntentionalClose = false;

    // 保存用户 ID，用于重连时保持用户身份
    const selfId = JSON.parse(localStorage.getItem('lego_builder_user')) || {};

    ws.onopen = () => {
        console.log('WebSocket 已连接!');
        // 首次连接发送用户信息
        ws.send(JSON.stringify({
            type: 'JOIN',
            data: selfId
        }));
        if (onOpen) onOpen();
    };

    ws.onclose = (event) => {
        console.log('WebSocket 已关闭: ', event.code, event.reason);

        if (onClose) onClose();

        // 如果不是故意关闭的连接，则尝试重连
        if (!isIntentionalClose && event.code !== 1000) {
            console.log(`WebSocket 连接断开，${WS_RECONNECT_DELAY / 1000}秒后重试...`);
            reconnectTimer = setTimeout(() => {
                console.log('尝试重新连接...');
                const newConnection = setupWebSocket({
                    roomId,
                    onOpen,
                    onClose,
                    onError,
                    onMessage
                });
                // 将新连接的引用传递给调用者
                if (connection.updateConnection) {
                    connection.updateConnection(newConnection);
                }
            }, WS_RECONNECT_DELAY);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket 错误: ', error);
        if (onError) onError(error);
    };

    ws.onmessage = (event) => {
        console.log('收到消息: ', event.data);
        if (onMessage) onMessage(event.data);
    };

    // 创建一个控制对象
    const connection = {
        sendUpdate: (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            } else {
                console.warn('WebSocket 不在打开状态，无法发送消息');
            }
        },
        close: () => {
            isIntentionalClose = true;
            clearTimeout(reconnectTimer);
            ws.close();
        },
        updateConnection: (newConn) => {
            Object.assign(connection, newConn);
        },
        // 暴露原始 WebSocket 对象以便进行高级操作
        ws
    };

    return connection;
};
