
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

export const APP_NAME = 'ChatSphere';

export const TYPING_TIMEOUT_MS = 1500;

export const STORAGE_KEYS = {
  TOKEN: 'chat_token',
  USER: 'chat_user',
};
