import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Navbar } from "./components/Navbar"
import { useAuth } from "./contexts/AuthContext"
import { displayNameFromUser } from "./lib/displayNameFromUser"

const USERNAME_KEY = "vifrost_username"

export interface AppOutletContext {
  username: string | null
  setUsername: (name: string) => void
}

function App() {
  const { user } = useAuth()
  const [guestUsername, setGuestUsernameState] = useState<string | null>(() =>
    typeof sessionStorage !== "undefined" ? sessionStorage.getItem(USERNAME_KEY) : null,
  )

  const setUsername = (name: string) => {
    setGuestUsernameState(name)
    sessionStorage.setItem(USERNAME_KEY, name)
  }

  const username = user ? displayNameFromUser(user) : guestUsername

  return (
    <>
      <Navbar />
      <Outlet context={{ username, setUsername } satisfies AppOutletContext} />
    </>
  )
}

export default App
