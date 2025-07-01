import React, { useState, useEffect, useRef } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import { useUnread } from "@/context/UnreadContext";

const GET_COMMENT_LIST_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/comment-list"
const ADD_COMMENT_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/add_comment"
const DELETE_COMMENT_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/delete_comment"
const MARK_COMMENT_AS_READ = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/mark_comment_as_read"
const MARK_COMMENT_AS_UNREAD = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/mark_unread_comment"
const REACT_TO_COMMENT = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/react_to_comment"

const ENABLE_COMMENT_REACTIONS = false;

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
  accountTier?: string;
};

export const CommentThread: React.FC<Props> = ({ photoId, currentUser, accountTier }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const hasMarkedRef = useRef(false);
  const { refreshUnread } = useUnread();

  useEffect(() => {
    const markReadIfOwner = async () => {
      // Fix: Extract username from photoId correctly
      // Format: public/user-creations/username/filename.jpg
      const pathParts = photoId.split("/");
      const photoOwner = pathParts[2]; // Get the username (3rd part)
      
      console.log("🔍 CommentThread Debug:", {
        photoId,
        photoOwner,
        currentUser,
        isOwner: photoOwner === currentUser,
        hasMarked: hasMarkedRef.current
      });

      if (photoOwner === currentUser && !hasMarkedRef.current) {
        console.log("📝 Marking comments as read for photo:", photoId);
        
        try {
          const res = await invokeLambdaIam({
            url: MARK_COMMENT_AS_READ,
            method: "POST",
            body: {
              username: currentUser,
              photoId
            }
          });
          
          console.log("✅ Mark as read response:", res);
          hasMarkedRef.current = true;
          
          // Refresh unread count after marking as read
          setTimeout(async () => {
            console.log("🔄 Calling refreshUnread after marking as read");
            try {
              await refreshUnread();
              console.log("✅ RefreshUnread completed successfully");
            } catch (refreshErr) {
              console.error("❌ RefreshUnread failed:", refreshErr);
            }
          }, 500);
          
        } catch (err) {
          console.error("❌ Failed to mark comments as read", err);
        }
      }
    };

    markReadIfOwner();
    fetchComments();
  }, [photoId, currentUser, refreshUnread]);

  const handleReact = async (commentId: string, emoji: string) => {
    try {
      await invokeLambdaIam({
        url: REACT_TO_COMMENT,
        method: "POST",
        body: {
          photoId,
          commentId,
          emoji,
        },
      });

      await fetchComments(); // refresh counts
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await invokeLambdaIam({
        url: GET_COMMENT_LIST_URL,
        method: "POST",
        body: { photoId },
      });
      setComments(res.comments || []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  const postComment = async () => {
    if (!currentUser || accountTier !== "premium") return;

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

      console.log("💬 Comment posted, triggering unread refresh");
      setText("");
      await fetchComments();
      
      // Refresh unread count after posting comment
      setTimeout(async () => {
        console.log("🔄 Refreshing unread after comment post");
        try {
          await refreshUnread();
          console.log("✅ RefreshUnread after post completed");
        } catch (refreshErr) {
          console.error("❌ RefreshUnread after post failed:", refreshErr);
        }
      }, 500);
      
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
      
      // Refresh unread count after deleting comment
      setTimeout(async () => {
        try {
          await refreshUnread();
        } catch (refreshErr) {
          console.error("❌ RefreshUnread after delete failed:", refreshErr);
        }
      }, 500);
      
    } catch (err) {
      console.error("Failed to delete comments:", err);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div>
        {comments.map((c) => (
          <div
            key={c.commentId}
            style={{
              borderBottom: "1px solid #ccc",
              padding: "6px 0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                    marginLeft: 8,
                  }}
                  title="Delete comment"
                >
                  🗑️
                </button>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                marginTop: 4,
                gap: 12,
              }}
            >
              {ENABLE_COMMENT_REACTIONS && ["👍", "❤️", "🔥"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(c.commentId, emoji)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    padding: "2px 6px",
                    borderRadius: 6,
                    backgroundColor: "#f1f1f1",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  title={`React with ${emoji}`}
                >
                  {emoji} {c.reactions?.[emoji] || 0}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {currentUser && accountTier === "premium" ? (
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
      ) : (
        <p style={{ fontStyle: "italic", color: "#666", marginTop: 8 }}>
          🔒 Only premium members can post comments.
        </p>
      )}
    </div>
  );
};