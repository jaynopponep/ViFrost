import "./theme/theme";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { LobbyPage } from "./pages/LobbyPage.tsx";
import { GamePage } from "./pages/GamePage.tsx";
import { ProfilePage } from "./pages/ProfilePage.tsx";
import { MatchHistoryPage } from "./pages/MatchHistoryPage.tsx";
import { LeaderboardPage } from "./pages/LeaderboardPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "lobby", element: <LobbyPage /> },
      { path: "game", element: <GamePage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "match-history", element: <MatchHistoryPage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
