import "./theme/theme";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { LobbyPage } from "./pages/LobbyPage.tsx";
import { GamePage } from "./pages/GamePage.tsx";
import { ProfilePage } from "./pages/ProfilePage.tsx";
import { MatchHistoryPage } from "./pages/MatchHistoryPage.tsx";
import { TutorialPage } from "./pages/TutorialPage.tsx";
import { LeaderboardPage } from "./pages/LeaderboardPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { SignupPage } from "./pages/SignupPage.tsx";
// TEMPORARY: ui preview route, remove with MatchPreviewPage when design lands.
import { MatchPreviewPage } from "./pages/MatchPreviewPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <App />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <LandingPage /> },
      { path: "lobby", element: <LobbyPage /> },
      { path: "game", element: <GamePage /> },
      { path: "match-preview", element: <MatchPreviewPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "match-history", element: <MatchHistoryPage /> },
      { path: "tutorial", element: <TutorialPage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
