import { useState } from 'react';

const RoomList = ({ rooms, activeRoomId, onSelectRoom, onCreateRoom, loadingRooms }) => {
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!newRoomName.trim()) return;

    setCreating(true);
    try {
      await onCreateRoom(newRoomName.trim());
      setNewRoomName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="room-list">
      <h2 className="room-list-title">Chat Rooms</h2>

      <form onSubmit={handleCreate} className="room-create-form">
        <input
          type="text"
          placeholder="New room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          maxLength={30}
        />
        <button type="submit" disabled={creating || !newRoomName.trim()}>
          {creating ? '...' : '+ Create'}
        </button>
      </form>
      {error && <p className="room-error">{error}</p>}

      <div className="room-items">
        {loadingRooms ? (
          <p className="room-empty">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p className="room-empty">No rooms yet. Create one!</p>
        ) : (
          rooms.map((room) => (
            <button
              key={room._id}
              className={`room-item ${activeRoomId === room._id ? 'room-item-active' : ''}`}
              onClick={() => onSelectRoom(room)}
            >
              <span className="room-hash">#</span>
              {room.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
