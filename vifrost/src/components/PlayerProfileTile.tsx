import { useNavigate } from "react-router-dom"
import leaderboardData from "../data/globalLeaderboard.json"
import profileData from "../data/profile.json"
import { Achievement } from "./profile/Achievement"
import { ActivityHeatmap } from "./profile/ActivityHeatmap"
import { CommandBar } from "./profile/CommandBar"
import { ProfileHeader } from "./profile/ProfileHeader"
import { RatingChart } from "./profile/RatingChart"
import { Panel } from "./ui/panel"
import { SectionLabel } from "./ui/section-label"
import { StatBlock } from "./ui/stat-block"

export interface PlayerProfileTileProps {
  username: string
}

type LeaderboardRowLite = { player: string; rating: number }

const LIFETIME_WINS = 72
const LIFETIME_LOSSES = 41
const LIFETIME_GAMES = LIFETIME_WINS + LIFETIME_LOSSES
const LIFETIME_WIN_RATE = Math.round((LIFETIME_WINS / LIFETIME_GAMES) * 100)

const ACHIEVEMENTS_EARNED = profileData.achievements.filter((a) => a.earned).length
const ACHIEVEMENTS_TOTAL = 32 // static "X / 32" display — the full set is aspirational

export function PlayerProfileTile({ username }: PlayerProfileTileProps) {
  const rows = leaderboardData as LeaderboardRowLite[]
  const myRow = rows.find((r) => r.player === username)
  const rating = myRow?.rating ?? 1482
  const navigate = useNavigate()

  return (
    <div className="flex w-full flex-col gap-4">
      <ProfileHeader
        username={profileData.username}
        handle={profileData.handle}
        joined={profileData.joined}
        bio={profileData.bio}
        rating={rating}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatBlock
          label="Rating"
          value={rating.toLocaleString("en-US")}
          sub={`Peak ${profileData.peak.toLocaleString("en-US")}`}
          accent
        />
        <StatBlock
          label="Percentile"
          value={profileData.percentile}
          sub="of ranked players"
        />
        <StatBlock
          label="Win Rate"
          value={`${LIFETIME_WIN_RATE}%`}
          sub={`${LIFETIME_WINS}W · ${LIFETIME_LOSSES}L`}
        />
        <StatBlock
          label="Streak"
          value={`${profileData.streak}W`}
          sub="current · peak 8W"
          accent
        />
        <StatBlock
          label="APM"
          value={profileData.apm}
          sub="avg actions/min"
        />
        <StatBlock
          label="Avg. Match"
          value={profileData.avgMatch}
          sub="median duration"
        />
      </div>

      <RatingChart />

      <ActivityHeatmap />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <SectionLabel className="mb-3.5">Most used commands</SectionLabel>
          {profileData.commands.map((c) => (
            <CommandBar
              key={c.label}
              label={c.label}
              count={c.count}
              pct={c.pct}
            />
          ))}
        </Panel>

        <Panel>
          <div className="mb-3.5 flex items-baseline justify-between">
            <SectionLabel>Achievements</SectionLabel>
            <div className="font-mono text-[11px] text-[var(--colorTextMuted)]">
              {ACHIEVEMENTS_EARNED} / {ACHIEVEMENTS_TOTAL}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {profileData.achievements.map((a) => (
              <Achievement
                key={a.title}
                glyph={a.glyph}
                title={a.title}
                sub={a.sub}
                earned={a.earned}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-2 text-right">
        <button
          type="button"
          onClick={() => navigate("/match-history")}
          className="cursor-pointer font-mono text-[12px] text-[var(--colorTextMuted)] underline underline-offset-4 hover:text-[var(--colorCyan)]"
        >
          View full match history →
        </button>
      </div>
    </div>
  )
}
