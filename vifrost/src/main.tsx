import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { lightPalette, darkPalette } from "./theme/theme";
import App from "./App.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { LobbyPage } from "./pages/LobbyPage.tsx";
import { GamePage } from "./pages/GamePage.tsx";
import { ProfilePage } from "./pages/ProfilePage.tsx";
import { MatchHistoryPage } from "./pages/MatchHistoryPage.tsx";
import { TutorialPage } from "./pages/TutorialPage.tsx";

const THEME_KEY = "vifrost_theme";

function resolveInitialTheme(): "dark" | "light" {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const initialTheme = resolveInitialTheme();
const pal = initialTheme === "dark" ? darkPalette : lightPalette;
document.documentElement.setAttribute("data-theme", initialTheme);
for (const [key, val] of Object.entries(pal)) {
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
      { path: "tutorial", element: <TutorialPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
