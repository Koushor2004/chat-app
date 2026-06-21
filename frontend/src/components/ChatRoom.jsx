import { useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import OnlineUsersList from './OnlineUsersList';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatRoom = ({ activeChat, onJoinRoom }) => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingClearTimers = useRef({});

  // Effect 1: Handle Room Chat Socket Connection & Events
  useEffect(() => {
    if (!socket || !connected || !activeChat || activeChat.type !== 'room') return;

    const room = activeChat.data;
    const isMember = room.members && room.members.includes(user._id);
    if (!isMember) return;

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
  }, [socket, connected, activeChat, user._id]);

  // Effect 2: Handle Direct Messaging HTTP Fetching & Socket Events
  useEffect(() => {
    if (!socket || !connected || !activeChat || activeChat.type !== 'dm') return;

    const targetUser = activeChat.data;

    setMessages([]);
    setTypingUsers([]);

    const fetchDirectHistory = async () => {
      try {
        const { data } = await api.get(`/messages/direct/${targetUser._id}`);
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch direct messages:', err.message);
      }
    };

    fetchDirectHistory();

    const handlePrivateMessage = (msg) => {
      const isFromTarget = msg.sender === targetUser._id && msg.recipient === user._id;
      const isFromMe = msg.sender === user._id && msg.recipient === targetUser._id;
      if (isFromTarget || isFromMe) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handlePrivateTyping = ({ senderId, username, isTyping }) => {
      if (senderId !== targetUser._id) return;

      setTypingUsers((prev) => {
        if (isTyping) {
          if (prev.includes(username)) return prev;
          return [...prev, username];
        }
        return prev.filter((u) => u !== username);
      });

      if (isTyping) {
        if (typingClearTimers.current[username]) {
          clearTimeout(typingClearTimers.current[username]);
        }
        typingClearTimers.current[username] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== username));
        }, 4000);
      }
    };

    socket.on('privateMessage', handlePrivateMessage);
    socket.on('privateTyping', handlePrivateTyping);

    return () => {
      socket.off('privateMessage', handlePrivateMessage);
      socket.off('privateTyping', handlePrivateTyping);
    };
  }, [socket, connected, activeChat, user._id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text) => {
    if (!socket || !activeChat) return;

    if (activeChat.type === 'room') {
      socket.emit('chatMessage', { roomId: activeChat.data._id, text });
    } else if (activeChat.type === 'dm') {
      socket.emit('privateMessage', { recipientId: activeChat.data._id, text });
    }
  };

  const handleTypingChange = (isTyping) => {
    if (!socket || !activeChat) return;

    if (activeChat.type === 'room') {
      socket.emit('typing', { roomId: activeChat.data._id, isTyping });
    } else if (activeChat.type === 'dm') {
      socket.emit('privateTyping', { recipientId: activeChat.data._id, isTyping });
    }
  };

  if (!activeChat) {
    return (
      <div className="chat-room chat-room-empty">
        <p>Select a room or start a direct message to start chatting 👋</p>
      </div>
    );
  }

  // Handle Join Room prompt
  if (activeChat.type === 'room') {
    const room = activeChat.data;
    const isMember = room.members && room.members.includes(user._id);

    if (!isMember) {
      return (
        <div className="chat-room join-room-wrapper">
          <div className="join-room-card">
            <div className="join-room-icon">#</div>
            <h2 className="join-room-title">Join {room.name}</h2>
            <p className="join-room-description">
              You are not a member of this chatroom. Join the room to see the conversation history and start chatting.
            </p>
            <button className="join-room-btn" onClick={() => onJoinRoom(room._id)}>
              Join Chatroom
            </button>
          </div>
        </div>
      );
    }
  }

  const isRoom = activeChat.type === 'room';
  const chatTitle = isRoom ? `# ${activeChat.data.name}` : `@ ${activeChat.data.username}`;

  return (
    <div className="chat-room">
      <div className="chat-room-main">
        <div className="chat-room-header">
          <h2>{chatTitle}</h2>
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

      {isRoom && (
        <OnlineUsersList users={onlineUsers} currentUsername={user.username} />
      )}
    </div>
  );
};

export default ChatRoom;
