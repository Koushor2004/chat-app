import { useEffect, useState } from 'react';
import RoomList from '../components/RoomList';
import ChatRoom from '../components/ChatRoom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { APP_NAME } from '../utils/constants';
import '../styles/chat.css';

const Chat = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
      if (activeChat && activeChat.type === 'room') {
        const stillExists = data.find((r) => r._id === activeChat.data._id);
        if (!stillExists) {
          setActiveChat(null);
        } else {
          setActiveChat({ type: 'room', data: stillExists });
        }
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err.message);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleGlobalOnlineUsers = (list) => {
      setOnlineUsers(list);
    };

    socket.on('globalOnlineUsers', handleGlobalOnlineUsers);
    return () => {
      socket.off('globalOnlineUsers', handleGlobalOnlineUsers);
    };
  }, [socket]);

  const handleCreateRoom = async (name) => {
    const { data } = await api.post('/rooms', { name });
    setRooms((prev) => [data, ...prev]);
    setActiveChat({ type: 'room', data });
    setSidebarOpen(false);
  };

  const handleSelectRoom = (room) => {
    setActiveChat({ type: 'room', data: room });
    setSidebarOpen(false);
  };

  const handleSelectDM = (targetUser) => {
    setActiveChat({ type: 'dm', data: targetUser });
    setSidebarOpen(false);
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const { data } = await api.post(`/rooms/${roomId}/join`);
      setRooms((prev) => prev.map((r) => (r._id === roomId ? data : r)));
      setActiveChat({ type: 'room', data });
    } catch (err) {
      console.error('Failed to join room:', err.message);
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-topbar">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen((s) => !s)} aria-label="Toggle rooms">
          ☰
        </button>
        <h1 className="chat-app-title">{APP_NAME}</h1>
        <div className="chat-topbar-right">
          <span className="chat-username">Hi, {user.username}</span>
          <button className="logout-btn" onClick={logout}>
            Log Out
          </button>
        </div>
      </header>

      <div className="chat-body">
        {sidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar-open' : ''}`}>
          <div className="sidebar-scrollable-content">
            <RoomList
              rooms={rooms}
              activeRoomId={activeChat?.type === 'room' ? activeChat.data._id : null}
              onSelectRoom={handleSelectRoom}
              onCreateRoom={handleCreateRoom}
              loadingRooms={loadingRooms}
            />

            <div className="dm-section">
              <h2 className="room-list-title">Direct Messages</h2>
              <div className="dm-items">
                {loadingUsers ? (
                  <p className="room-empty">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="room-empty">No other users found</p>
                ) : (
                  users.map((u) => {
                    const isOnline = onlineUsers.some((ou) => ou.id === u._id);
                    const isActive = activeChat?.type === 'dm' && activeChat.data._id === u._id;
                    return (
                      <button
                        key={u._id}
                        className={`room-item dm-item ${isActive ? 'room-item-active' : ''}`}
                        onClick={() => handleSelectDM(u)}
                      >
                        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
                        <span className="dm-username">{u.username}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="sidebar-user-section">
            <div className="sidebar-user-info">
              <span className="sidebar-user-dot" />
              <span className="sidebar-username">{user.username}</span>
            </div>
            <button className="sidebar-logout-btn" onClick={logout} aria-label="Log out">
              Log Out
            </button>
          </div>
        </aside>

        <main className="chat-main">
          <ChatRoom 
            activeChat={activeChat} 
            onJoinRoom={handleJoinRoom} 
            onBack={() => setActiveChat(null)}
            onToggleSidebar={() => setSidebarOpen((s) => !s)}
          />
        </main>
      </div>
    </div>
  );
};

export default Chat;
