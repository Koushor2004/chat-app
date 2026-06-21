import { useEffect, useState } from 'react';
import RoomList from '../components/RoomList';
import ChatRoom from '../components/ChatRoom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { APP_NAME } from '../utils/constants';
import '../styles/chat.css';

const Chat = () => {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
      // Keep active room selection in sync if it still exists
      if (activeRoom) {
        const stillExists = data.find((r) => r._id === activeRoom._id);
        if (!stillExists) setActiveRoom(null);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err.message);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRoom = async (name) => {
    const { data } = await api.post('/rooms', { name });
    setRooms((prev) => [data, ...prev]);
    setActiveRoom(data);
    setSidebarOpen(false);
  };

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    setSidebarOpen(false);
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
        <aside className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar-open' : ''}`}>
          <RoomList
            rooms={rooms}
            activeRoomId={activeRoom?._id}
            onSelectRoom={handleSelectRoom}
            onCreateRoom={handleCreateRoom}
            loadingRooms={loadingRooms}
          />
        </aside>

        <main className="chat-main">
          <ChatRoom room={activeRoom} />
        </main>
      </div>
    </div>
  );
};

export default Chat;
