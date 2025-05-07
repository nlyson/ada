import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const GET_UNREAD_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_unread_comment_flags";

type UnreadContextType = {
  unreadCount: number;
  refreshUnread: () => void;
};

const UnreadContext = createContext<UnreadContextType>({
  unreadCount: 0,
  refreshUnread: () => {},
});

export function useUnread() {
  return useContext(UnreadContext);
}

export function UnreadProvider({ user, children }: { user?: { username: string }, children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user?.username) return;
    try {
      const res = await invokeLambdaIam({
        url: GET_UNREAD_URL,
        method: "POST",
        body: { username: user.username },
      });
      setUnreadCount(res.unreadPhotos?.length || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [user?.username]);

  return (
    <UnreadContext.Provider value={{ unreadCount, refreshUnread: fetchUnread }}>
      {children}
    </UnreadContext.Provider>
  );
}
