import { useState, useRef } from 'react';
import { TYPING_TIMEOUT_MS } from '../utils/constants';

const MessageInput = ({ onSendMessage, onTyping, disabled }) => {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleChange = (e) => {
    setText(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, TYPING_TIMEOUT_MS);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setText('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    onTyping(false);
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="message-input"
        placeholder={disabled ? 'Join a room to start chatting' : 'Type a message...'}
        value={text}
        onChange={handleChange}
        disabled={disabled}
        maxLength={1000}
      />
      <button type="submit" className="message-send-btn" disabled={disabled || !text.trim()}>
        Send
      </button>
    </form>
  );
};

export default MessageInput;
