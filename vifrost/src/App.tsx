import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import TransitionProvider from "./providers/TransitionProvider";
import { AuthRedirect } from "./components/guards/AuthRedirect";
import { useAuth } from "./contexts/AuthContext";
import { useProfile } from "./contexts/ProfileContext";
import { displayNameFromUser } from "./lib/displayNameFromUser";
import { useWebSocket } from "./hooks/useWebSocket";
import type { ServerMessage, WebSocketStatus } from "./hooks/useWebSocket";
import type { KeybindEventKind } from "./hooks/vimPenalty";

const USERNAME_KEY = "vifrost_username";

export interface AppOutletContext {
  username: string | null;
  setUsername: (name: string) => void;
  wsStatus: WebSocketStatus;
  connectWs: () => void;
  isWsOpen: boolean;
  sendJoinQueue: (username: string, token: string, mode: "ranked" | "casual") => void;
  sendKeybindEvent: (kind: KeybindEventKind, count?: number) => void;
  sendRunCode: (code: string) => void;
  sendReady: () => void;
  sendSubmit: () => void;
  lastMessage: ServerMessage | null;
}

function App() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [guestUsername, setGuestUsernameState] = useState<string | null>(() =>
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(USERNAME_KEY)
      : null,
  );

  const setUsername = (name: string) => {
    setGuestUsernameState(name);
    sessionStorage.setItem(USERNAME_KEY, name);
  };

  const username = user
    ? profile?.full_name?.trim() || displayNameFromUser(user)
    : guestUsername;

  const {
    status,
    lastMessage,
    connect,
    sendJoinQueue,
    sendKeybindEvent,
    sendRunCode,
    sendReady,
    sendSubmit,
  } = useWebSocket({
    connectImmediately: false,
  });

  return (
    <TransitionProvider>
      <AuthRedirect />
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
            sendKeybindEvent,
            sendRunCode,
            sendReady,
            sendSubmit,
            lastMessage,
          } satisfies AppOutletContext
        }
      />
    </TransitionProvider>
  );
}

export default App;
