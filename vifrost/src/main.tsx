import "./theme/theme"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import "./index.css"
import App from "./App.tsx"
import { AuthProvider } from "./contexts/AuthContext.tsx"
import { ProfileProvider } from "./contexts/ProfileContext.tsx"
import { queryClient } from "./lib/queryClient.ts"
import { Toaster } from "./components/ui/sonner.tsx"
import { LandingPage } from "./pages/LandingPage.tsx"
import { LobbyPage } from "./pages/LobbyPage.tsx"
import { GamePage } from "./pages/GamePage.tsx"
import { ProfilePage } from "./pages/ProfilePage.tsx"
import { MatchHistoryPage } from "./pages/MatchHistoryPage.tsx"
import { TutorialPage } from "./pages/TutorialPage.tsx"
import { LeaderboardPage } from "./pages/LeaderboardPage.tsx"
import { LoginPage } from "./pages/LoginPage.tsx"
import { SignupPage } from "./pages/SignupPage.tsx"
import { PendingApprovalPage } from "./pages/PendingApprovalPage.tsx"
import { BannedPage, RejectedPage } from "./pages/AccountRestrictedPage.tsx"
import { UnauthorizedPage } from "./pages/UnauthorizedPage.tsx"
import { AdminDashboardPage } from "./pages/AdminDashboardPage.tsx"
import { ApprovedRoute } from "./components/guards/ApprovedRoute.tsx"
import { AdminRoute } from "./components/guards/AdminRoute.tsx"
import { ProtectedRoute } from "./components/guards/ProtectedRoute.tsx"

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            <App />
            <Toaster richColors position="top-right" />
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    ),
    children: [
      { index: true, element: <LandingPage /> },
      {
        path: "lobby",
        element: (
          <ApprovedRoute>
            <LobbyPage />
          </ApprovedRoute>
        ),
      },
      {
        path: "game",
        element: (
          <ApprovedRoute>
            <GamePage />
          </ApprovedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "match-history",
        element: (
          <ApprovedRoute>
            <MatchHistoryPage />
          </ApprovedRoute>
        ),
      },
      { path: "tutorial", element: <TutorialPage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      {
        path: "pending",
        element: (
          <ProtectedRoute>
            <PendingApprovalPage />
          </ProtectedRoute>
        ),
      },
      { path: "banned", element: <BannedPage /> },
      {
        path: "rejected",
        element: (
          <ProtectedRoute>
            <RejectedPage />
          </ProtectedRoute>
        ),
      },
      { path: "unauthorized", element: <UnauthorizedPage /> },
      {
        path: "admin/dashboard",
        element: (
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        ),
      },
    ],
  },
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
