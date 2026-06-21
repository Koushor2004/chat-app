const OnlineUsersList = ({ users, currentUsername }) => {
  return (
    <div className="online-users">
      <h3 className="online-users-title">
        Online <span className="online-count">({users.length})</span>
      </h3>
      <ul className="online-users-list">
        {users.map((u) => (
          <li key={u.id} className="online-user-item">
            <span className="online-dot" />
            {u.username}
            {u.username === currentUsername && <span className="you-tag"> (you)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnlineUsersList;
