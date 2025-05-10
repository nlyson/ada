import React, { useState, useEffect, useRef } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import { useUnread } from "@/context/UnreadContext";

const GET_COMMENT_LIST_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/comment-list"
const ADD_COMMENT_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/add_comment"
const DELETE_COMMENT_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/delete_comment"
const MARK_COMMENT_AS_READ = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/mark_comment_as_read"
const MARK_COMMENT_AS_UNREAD = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/mark_unread_comment"

type Comment = {
  commentId: string;
  username: string;
  text: string;
  timestamp: string;
  reactions?: Record<string, number>;
};

type Props = {
  photoId: string;
  currentUser: string;
};

export const CommentThread: React.FC<Props> = ({ photoId, currentUser }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const hasMarkedRef = useRef(false);
  const { refreshUnread } = useUnread();

  useEffect(() => {
    const markReadIfOwner = async () => {
        const photoOwner = photoId.split("/")[1]; // Assumes format: user-creations/username/photo.jpg
        if (photoOwner === currentUser && !hasMarkedRef.current) {
            try {
              const res = await invokeLambdaIam({
                url: MARK_COMMENT_AS_READ,
                method: "POST",
                body: { 
                  username: currentUser, 
                  photoId
                }
              });
              hasMarkedRef.current = true;
              refreshUnread(); // 👈 This will update the red badge
            } catch (err) {
              console.error("❌ Failed to mark comments as read", err);
            }
          }
        };

        markReadIfOwner();
        fetchComments();
  }, [photoId, currentUser]);

  const fetchComments = async () => {
    try {
        const res = await invokeLambdaIam({
            url: GET_COMMENT_LIST_URL,
            method: "POST",
            body: {photoId},
        });
        setComments(res.comments || []);
    } catch (err) {
        console.error("Failed to fetch comments:", err);
    }
  };

  const postComment = async () => {
    try {
        const res = await invokeLambdaIam({
            url: ADD_COMMENT_URL,
            method: "POST",
            body: { 
                photoId,
                username: currentUser,
                text
            }
        });
        const res2 = await invokeLambdaIam({
            url: MARK_COMMENT_AS_UNREAD,
            method: "POST",
            body: { photoId }
        });

        setText("");
        await fetchComments();
    } catch (err) {
        console.error("Failed to add comments:", err);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
        const res = await invokeLambdaIam({
            url: DELETE_COMMENT_URL,
            method: "POST",
            body: { 
                photoId,
                commentId,
                requesterUsername: currentUser
            }
        });
        await fetchComments();
    } catch (err) {
        console.error("Failed to delete comments:", err);
    }

  };

  return (
    <div style={{ marginTop: 8 }}>
  <div>
    {comments.map((c) => (
      <div key={c.commentId} style={{ borderBottom: "1px solid #ccc", padding: "4px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>{c.username}</strong>: {c.text}
        </div>
        {(c.username === currentUser || photoId.includes(`/${currentUser}/`)) && (
          <button
            onClick={() => handleDelete(c.commentId)}
            style={{
              background: "none",
              border: "none",
              color: "red",
              cursor: "pointer",
              fontSize: "1rem",
              marginLeft: 8
            }}
            title="Delete comment"
          >
            🗑️
          </button>
        )}
      </div>
    ))}
  </div>
      <div style={{ marginTop: 4 }}>
        <textarea
          value={text}
          placeholder="Leave a comment"
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%", height: 50 }}
        />
        <button disabled={!text.trim()} onClick={postComment}>
          Post Comment
        </button>
      </div>
    </div>
  );
};
