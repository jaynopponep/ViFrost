import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { palette } from "./theme/theme";
import App from "./App.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { LobbyPage } from "./pages/LobbyPage.tsx";
import { GamePage } from "./pages/GamePage.tsx";
import { ProfilePage } from "./pages/ProfilePage.tsx";
import { MatchHistoryPage } from "./pages/MatchHistoryPage.tsx";

for (const [key, val] of Object.entries(palette)) {
  document.documentElement.style.setProperty(`--${key}`, val);
}

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
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
