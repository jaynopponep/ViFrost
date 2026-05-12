import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Terminal, Trophy } from 'lucide-react'
import BorderGlow from '../components/BorderGlow'
import { Backlight } from '../components/ui/backlight'
import './LandingPage.css'

function VimLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 213 207"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M120.825 130.781C121.162 131.119 121.837 131.625 122.344 131.625H131.288C131.794 131.625 132.469 131.119 132.806 130.781L135.169 128.25C135.506 127.912 135.675 127.575 135.675 127.238L138.206 118.631C138.375 117.788 138.206 116.944 137.7 116.438L135.844 114.919C135.506 114.581 134.831 114.75 134.325 114.75H126.225L125.887 114.413L125.719 114.244C125.381 114.244 125.044 114.075 124.706 114.413L121.5 116.438C121.162 116.438 120.994 117.281 120.825 117.619L118.125 125.887C117.787 126.731 117.956 127.744 118.631 128.419L120.825 130.781ZM122.175 175.331L121.5 175.5H119.475L131.625 139.894C131.963 138.713 131.456 137.362 130.275 137.025L129.6 136.856H109.181C108.337 137.025 107.662 137.7 107.494 138.544L106.312 142.762C105.975 143.944 106.819 144.956 108 145.294L108.506 145.125H111.544L99.225 180.394C98.8875 181.575 99.3937 183.094 100.575 183.6L101.25 184.106H120.15C121.162 184.106 122.006 183.263 122.344 182.25L123.525 178.2C124.031 177.019 123.356 175.669 122.175 175.331ZM211.781 142.087L208.575 137.869V137.7C208.069 137.194 207.562 136.688 206.887 136.688H194.738C194.063 136.688 193.556 137.362 193.05 137.7L189.675 141.75H184.444L180.9 137.7V137.531C180.562 137.025 179.887 136.688 179.212 136.688H172.462L206.55 102.6L168.413 64.8L202.5 29.7V14.5125L197.775 8.4375H128.756L123.188 14.3438V19.2375L104.119 0L91.125 12.6562L87.075 8.4375H18.9L13.5 14.6812V30.5438L18.5625 35.4375H23.625V79.4812L0 103.106L23.625 126.731V180.731L32.4 185.625H51.975L67.3313 169.594L103.781 206.044L128.25 181.575C128.419 182.25 128.925 182.419 129.769 182.756L130.444 182.419H146.306C147.319 182.419 148.163 182.25 148.331 181.406L149.512 178.031C149.85 176.85 149.344 175.838 148.163 175.5L147.488 175.669H146.812L152.55 157.613L156.431 153.731H164.869L156.431 180.562C156.094 181.744 156.769 182.419 157.95 182.925L158.625 182.587H173.981C174.825 182.587 175.669 182.419 176.006 181.575L177.356 178.538C177.862 177.356 177.188 176.344 176.175 175.837C176.006 175.669 175.669 175.837 175.331 175.837H174.656L181.744 153.9H192.038L183.431 180.731C183.094 181.912 183.769 182.588 184.95 182.925L185.625 182.419H202.5C203.344 182.419 204.187 182.25 204.525 181.406L205.875 178.031C206.381 176.85 205.706 175.838 204.525 175.5C204.356 175.331 204.019 175.669 203.681 175.669H202.5L211.95 144.45C212.287 143.606 212.119 142.594 211.781 142.087ZM104.119 3.20625L123.188 22.275V30.2062L128.925 37.125H131.625L82.6875 84.375V37.125H88.2562L92.8125 30.0375V15.0187L92.475 14.5125L104.119 3.20625ZM3.20625 103.106L23.625 82.6875V123.525L3.20625 103.106ZM68.85 167.738L167.4 66.4875L203.512 102.769L169.425 136.856H169.256C168.75 137.025 168.412 137.362 168.075 137.7L164.531 141.75H159.637L155.925 137.7C155.588 137.194 154.913 136.688 154.238 136.688H139.387C138.375 136.688 137.531 137.362 137.194 138.375L135.844 142.594C135.506 143.775 136.013 144.787 137.194 145.294H139.725L128.925 177.188L103.444 202.837L68.85 167.738Z"
        fill="currentColor"
      />
    </svg>
  )
}

// for border glow
function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])
  return isDark
}

export function LandingPage() {
  const navigate = useNavigate()
  const isDark = useIsDark()

  const cardColors: [string, string, string] = isDark
    ? ['#0e7490', '#9de3f7', '#06b6d4']
    : ['#06b6d4', '#38bdf8', '#0ea5e9']
  const cardBg = isDark ? '#0d2230' : 'var(--colorSurface)'
  const glowColor = isDark ? '190 80 65' : '195 90 55'
  const glowIntensity = isDark ? 1.0 : 1.6
  const coneSpread = isDark ? 25 : 32

  return (
    <main className="landing">
      <Backlight blur={15} className="landing__logo-wrap">
        <VimLogo className="landing__logo" />
      </Backlight>

      <h1 className="landing__wordmark">ViFrost</h1>
      <p className="landing__tagline">Test your VIM skills in solo or multiplayer!</p>

      <div className="landing__cards">
        <BorderGlow
          colors={cardColors}
          glowColor={glowColor}
          glowIntensity={glowIntensity}
          coneSpread={coneSpread}
          backgroundColor={cardBg}
          borderRadius={20}
          onClick={() => navigate('/lobby', { state: { mode: 'casual' } })}
        >
          <div className="landing__card-inner">
            <div className="landing__card-icon">
              <Terminal strokeWidth={1.8} />
            </div>
            <span className="landing__card-label">Casual</span>
          </div>
        </BorderGlow>

        <BorderGlow
          colors={cardColors}
          glowColor={glowColor}
          glowIntensity={glowIntensity}
          coneSpread={coneSpread}
          backgroundColor={cardBg}
          borderRadius={20}
          onClick={() => navigate('/lobby', { state: { mode: 'ranked' } })}
        >
          <div className="landing__card-inner">
            <div className="landing__card-icon">
              <Trophy strokeWidth={1.8} />
            </div>
            <span className="landing__card-label">Ranked</span>
          </div>
        </BorderGlow>
      </div>
    </main>
  )
}
