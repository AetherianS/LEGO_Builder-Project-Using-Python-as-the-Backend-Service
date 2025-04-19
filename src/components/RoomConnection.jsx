import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate, useParams } from 'react-router-dom';

export const RoomConnection = ({ children }) => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { connect, disconnect, connected, connecting, error } = useStore();
    const [initialConnectAttempted, setInitialConnectAttempted] = useState(false);

    useEffect(() => {
        if (roomId && !initialConnectAttempted) {
            connect(roomId);
            setInitialConnectAttempted(true);
        }

        return () => {
            if (initialConnectAttempted) {
                disconnect();
            }
        };
    }, [roomId, connect, disconnect, initialConnectAttempted]);

    if (connecting) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">连接到房间...</h2>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">连接错误</h2>
                    <p className="mb-4">{error.message || '无法连接到房间'}</p>
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => navigate('/')}
                    >
                        返回主页
                    </button>
                </div>
            </div>
        );
    }

    if (!connected && initialConnectAttempted) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">已断开连接</h2>
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-4"
                        onClick={() => connect(roomId)}
                    >
                        重新连接
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        onClick={() => navigate('/')}
                    >
                        返回主页
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
