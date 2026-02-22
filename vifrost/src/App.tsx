import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './components/Navbar'

const USERNAME_KEY = 'vifrost_username'

export interface AppOutletContext {
  username: string | null
  setUsername: (name: string) => void
}

function App() {
  const [username, setUsernameState] = useState<string | null>(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(USERNAME_KEY) : null
  )

  const setUsername = (name: string) => {
    setUsernameState(name)
    sessionStorage.setItem(USERNAME_KEY, name)
  }

  return (
    <>
      <Navbar username={username} onUsernameSet={setUsername} />
      <Outlet context={{ username, setUsername } satisfies AppOutletContext} />
    </>
  )
}

export default App
