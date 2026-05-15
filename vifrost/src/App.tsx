import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { useAuth } from "./contexts/AuthContext";
import { displayNameFromUser } from "./lib/displayNameFromUser";
import { useWebSocket } from "./hooks/useWebSocket";
import type { Envelope, WebSocketStatus } from "./hooks/useWebSocket";

const USERNAME_KEY = "vifrost_username";

export interface AppOutletContext {
  username: string | null
  setUsername: (name: string) => void
  wsStatus: WebSocketStatus
  connectWs: () => void
  isWsOpen: boolean
  sendJoinQueue: (username: string) => void
  sendScoreUpdate: (delta: number, keybindDelta?: number) => void
  sendRunCode: (code: string) => void
  sendSubmit: () => void
  lastMessage: Envelope | null
}

function App() {
  const { user } = useAuth();
  const [guestUsername, setGuestUsernameState] = useState<string | null>(() =>
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(USERNAME_KEY)
      : null,
  );

  const setUsername = (name: string) => {
    setGuestUsernameState(name);
    sessionStorage.setItem(USERNAME_KEY, name);
  };

  const username = user ? displayNameFromUser(user) : guestUsername;

  const {
    status,
    lastMessage,
    connect,
    sendJoinQueue,
    sendScoreUpdate,
    sendRunCode,
    sendSubmit,
  } = useWebSocket({
    connectImmediately: false,
  });

  return (
    <>
      <Navbar />
      <Outlet
        context={
          {
            username,
            setUsername,
            wsStatus: status,
            connectWs: connect,
            isWsOpen: status === "open",
            sendJoinQueue,
            sendScoreUpdate,
            sendRunCode,
            sendSubmit,
            lastMessage,
          } satisfies AppOutletContext
        }
      />
    </>
  );
}

export default App;
