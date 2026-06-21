import { useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import OnlineUsersList from './OnlineUsersList';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatRoom = ({ room }) => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingClearTimers = useRef({});

  // Join room whenever room or socket connection changes
  useEffect(() => {
    if (!socket || !connected || !room) return;

    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);

    socket.emit('joinRoom', { roomId: room._id });

    const handleChatHistory = (history) => setMessages(history);

    const handleChatMessage = (msg) => {
      if (msg.room !== room._id) return;
      setMessages((prev) => [...prev, msg]);
    };

    const handleOnlineUsers = (users) => setOnlineUsers(users);

    const handleTyping = ({ username, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (prev.includes(username)) return prev;
          return [...prev, username];
        }
        return prev.filter((u) => u !== username);
      });

      // Safety net: clear stale typing state after 4s in case "stopped" event is missed
      if (isTyping) {
        if (typingClearTimers.current[username]) {
          clearTimeout(typingClearTimers.current[username]);
        }
        typingClearTimers.current[username] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== username));
        }, 4000);
      }
    };

    const handleErrorMessage = ({ message }) => {
      console.error('Socket error:', message);
    };

    socket.on('chatHistory', handleChatHistory);
    socket.on('chatMessage', handleChatMessage);
    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('typing', handleTyping);
    socket.on('errorMessage', handleErrorMessage);

    return () => {
      socket.off('chatHistory', handleChatHistory);
      socket.off('chatMessage', handleChatMessage);
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('typing', handleTyping);
      socket.off('errorMessage', handleErrorMessage);
    };
  }, [socket, connected, room]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text) => {
    if (!socket || !room) return;
    socket.emit('chatMessage', { roomId: room._id, text });
  };

  const handleTypingChange = (isTyping) => {
    if (!socket || !room) return;
    socket.emit('typing', { roomId: room._id, isTyping });
  };

  if (!room) {
    return (
      <div className="chat-room chat-room-empty">
        <p>Select or create a room to start chatting 👋</p>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-room-main">
        <div className="chat-room-header">
          <h2># {room.name}</h2>
          <span className={`connection-badge ${connected ? 'connection-on' : 'connection-off'}`}>
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <p className="messages-empty">No messages yet. Say hello! 👋</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderUsername === user.username;
              return (
                <div key={msg._id} className={`message-bubble-row ${isOwn ? 'own' : ''}`}>
                  <div className={`message-bubble ${isOwn ? 'message-bubble-own' : ''}`}>
                    {!isOwn && <span className="message-sender">{msg.senderUsername}</span>}
                    <p className="message-text">{msg.text}</p>
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <TypingIndicator typingUsers={typingUsers.filter((u) => u !== user.username)} />

        <MessageInput onSendMessage={handleSendMessage} onTyping={handleTypingChange} disabled={!connected} />
      </div>

      <OnlineUsersList users={onlineUsers} currentUsername={user.username} />
    </div>
  );
};

export default ChatRoom;
