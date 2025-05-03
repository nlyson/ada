import React, { useState } from "react";


type UserSearchProps = {
  onSearch: () => void;
};

const UserSearch: React.FC<UserSearchProps> = ({ onSearch }) => {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSearch(); // Close menu
      window.location.href = `/users/${username.trim().toLowerCase()}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        style={{
          flex: 1,
          padding: "0.5rem",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#0077cc",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Search
      </button>
    </form>
  );
};

export default UserSearch;