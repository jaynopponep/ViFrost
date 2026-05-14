import type { User } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom"
import { displayNameFromUser } from "@/lib/displayNameFromUser"
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
  /** When present, header and identity reflect this Supabase account (signup profile). */
  user?: User | null
}

function accountHandleFromEmail(email: string | undefined): string {
  if (!email?.includes("@")) return "@player"
  const local = email.split("@")[0] ?? "player"
  const slug = local
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase()
  return `@${slug || "player"}`
}

function handleFromDisplayName(displayName: string): string {
  const trimmed = displayName.trim() || "guest"
  const slug = trimmed
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase()
  return `@${slug || "guest"}`
}

function joinedFromUser(createdAt: string | undefined): string {
  if (!createdAt) return "Joined recently"
  const d = new Date(createdAt)
  return `Joined ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
}

function bioFromUser(user: User): string {
  const raw = user.user_metadata?.bio
  if (typeof raw === "string" && raw.trim()) return raw.trim()
  return "New ViFrost player — your stats and achievements will appear as you play."
}

type LeaderboardRowLite = { player: string; rating: number }

const LIFETIME_WINS = 72
const LIFETIME_LOSSES = 41
const LIFETIME_GAMES = LIFETIME_WINS + LIFETIME_LOSSES
const LIFETIME_WIN_RATE = Math.round((LIFETIME_WINS / LIFETIME_GAMES) * 100)

const ACHIEVEMENTS_EARNED = profileData.achievements.filter((a) => a.earned).length
const ACHIEVEMENTS_TOTAL = 32 // static "X / 32" display — the full set is aspirational

export function PlayerProfileTile({ username, user }: PlayerProfileTileProps) {
  const navigate = useNavigate()
  const rows = leaderboardData as LeaderboardRowLite[]

  if (user) {
    const displayName = displayNameFromUser(user)
    const myRow = rows.find((r) => r.player === displayName)
    const rating = myRow?.rating ?? 1000
    const handle = accountHandleFromEmail(user.email ?? undefined)
    const joined = joinedFromUser(user.created_at)
    const bio = bioFromUser(user)

    return (
      <div className="flex w-full flex-col gap-4">
        <ProfileHeader
          username={displayName}
          handle={handle}
          joined={joined}
          bio={bio}
          rating={rating}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatBlock
            label="Rating"
            value={myRow ? rating.toLocaleString("en-US") : "—"}
            sub={myRow ? "From leaderboard data" : "Unranked · play ranked to get listed"}
            accent
          />
          <StatBlock label="Percentile" value="—" sub="No ranked data yet" />
          <StatBlock label="Win rate" value="—" sub="No ranked matches yet" />
          <StatBlock label="Streak" value="—" sub="Win streaks show here" accent />
          <StatBlock label="APM" value="—" sub="After your first games" />
          <StatBlock label="Avg. match" value="—" sub="Median duration" />
        </div>

        <Panel>
          <SectionLabel className="mb-2">Your ViFrost profile</SectionLabel>
          <p className="m-0 max-w-[560px] text-sm leading-relaxed text-[var(--colorTextMuted)]">
            Charts, command usage, activity heatmap, and achievements from the demo profile are hidden until we
            sync real match data to your account. Jump into the lobby to start building your record.
          </p>
          <button
            type="button"
            onClick={() => navigate("/lobby")}
            className="mt-4 cursor-pointer rounded-lg border border-[var(--colorCyan)] bg-[color-mix(in_srgb,var(--colorCyan)_18%,transparent)] px-4 py-2 font-mono text-sm font-medium text-[var(--colorCyan)] transition-colors hover:bg-[color-mix(in_srgb,var(--colorCyan)_28%,transparent)]"
          >
            Go to lobby →
          </button>
        </Panel>

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

  const myRow = rows.find((r) => r.player === username)
  const rating = myRow?.rating ?? 1482

  return (
    <div className="flex w-full flex-col gap-4">
      <ProfileHeader
        username={username}
        handle={handleFromDisplayName(username)}
        joined="Not signed in"
        bio="Sample stats from a demo profile. Sign up to track your own progress."
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
