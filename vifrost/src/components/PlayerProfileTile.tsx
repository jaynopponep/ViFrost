import type { User } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom"
import { displayNameFromUser } from "@/lib/displayNameFromUser"
import profileData from "../data/profile.json"
import { useProfile } from "@/contexts/ProfileContext"
import { Achievement } from "./profile/Achievement"
import { ActivityHeatmap } from "./profile/ActivityHeatmap"
import { CommandBar } from "./profile/CommandBar"
import { ProfileHeader } from "./profile/ProfileHeader"
import { RatingChart } from "./profile/RatingChart"
import { Panel } from "./ui/panel"
import { SectionLabel } from "./ui/section-label"
import { StatBlock } from "./ui/stat-block"
import { useProfileInsights } from "@/hooks/useProfileInsights"

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

const ACHIEVEMENTS_EARNED = profileData.achievements.filter((a) => a.earned).length
const ACHIEVEMENTS_TOTAL = 32 // static "X / 32" display — the full set is aspirational

// deterministic sample data so the unsigned demo/showcase view keeps its
// populated look without faking signed-in stats.
const DEMO_RATING_POINTS: number[] = (() => {
  const pts: number[] = []
  let r = 1200
  for (let i = 0; i < 90; i++) {
    r += Math.sin(i * 1.8) * 6 + 1.8
    r = Math.max(900, Math.min(1650, r))
    pts.push(Math.round(r))
  }
  pts.push(1482)
  return pts
})()

const DEMO_HEATMAP = {
  cells: Array.from({ length: 12 * 7 }, (_, i) => {
    const v = (Math.sin(i * 2.31) + Math.cos(i * 0.77) + 2) / 4
    return v < 0.45 ? 0 : v < 0.7 ? 1 : v < 0.87 ? 2 : v < 0.96 ? 3 : 4
  }),
  total: 84,
  weeks: 12,
}

export function PlayerProfileTile({ username, user }: PlayerProfileTileProps) {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const insights = useProfileInsights(user?.id, profile ?? null)
  const earnedCount = insights.achievements.filter((a) => a.earned).length

  // live stats from the signed-in user's profile; fall back to zero until loaded
  const liveWins = profile?.wins ?? 0
  const liveLosses = profile?.losses ?? 0
  const liveTies = profile?.ties ?? 0
  const liveGames = liveWins + liveLosses + liveTies
  const liveWinRate = liveGames > 0 ? Math.round((liveWins / liveGames) * 100) : 0
  const liveRating = profile?.rating ?? 400
  const livePeak = profile?.peak_rating ?? 400
  const liveStreak = profile?.current_streak ?? 0

  if (user) {
    const displayName = displayNameFromUser(user)
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
          rating={liveRating}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatBlock
            label="Rating"
            value={liveRating.toLocaleString("en-US")}
            sub={`Peak ${livePeak.toLocaleString("en-US")}`}
            accent
          />
          <StatBlock
            label="Percentile"
            value={insights.percentile ?? "—"}
            sub={insights.percentile ? "of ranked players" : "No ranked data yet"}
          />
          <StatBlock
            label="Win Rate"
            value={liveGames > 0 ? `${liveWinRate}%` : "—"}
            sub={liveGames > 0 ? `${liveWins}W · ${liveLosses}L · ${liveTies}T` : "No ranked matches yet"}
          />
          <StatBlock
            label="Streak"
            value={liveStreak > 0 ? `${liveStreak}W` : "—"}
            sub="Win streaks show here"
            accent
          />
          <StatBlock label="APM" value="—" sub="Not tracked yet" />
          <StatBlock label="Avg. match" value="—" sub="Not tracked yet" />
        </div>

        <RatingChart points={insights.ratingPoints} />

        <ActivityHeatmap
          cells={insights.heatmap.cells}
          total={insights.heatmap.total}
          weeks={insights.heatmap.weeks}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Panel>
            <SectionLabel className="mb-3.5">Most used commands</SectionLabel>
            <p className="m-0 text-sm leading-relaxed text-[var(--colorTextMuted)]">
              Command usage isn't tracked yet — it will appear here once
              per-command stats are captured.
            </p>
          </Panel>

          <Panel>
            <div className="mb-3.5 flex items-baseline justify-between">
              <SectionLabel>Achievements</SectionLabel>
              <div className="font-mono text-[11px] text-[var(--colorTextMuted)]">
                {earnedCount} / {insights.achievements.length}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {insights.achievements.map((a) => (
                <Achievement
                  key={a.title}
                  glyph={a.glyph}
                  title={a.title}
                  sub={a.sub}
                  earned={a.earned}
                  locked={a.locked}
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

  const rating = liveRating

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
          sub={`Peak ${livePeak.toLocaleString("en-US")}`}
          accent
        />
        <StatBlock
          label="Percentile"
          value={profileData.percentile}
          sub="of ranked players"
        />
        <StatBlock
          label="Win Rate"
          value={liveGames > 0 ? `${liveWinRate}%` : "—"}
          sub={liveGames > 0 ? `${liveWins}W · ${liveLosses}L · ${liveTies}T` : "No ranked matches yet"}
        />
        <StatBlock
          label="Streak"
          value={liveStreak > 0 ? `${liveStreak}W` : "—"}
          sub="current streak"
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

      <RatingChart points={DEMO_RATING_POINTS} />

      <ActivityHeatmap
        cells={DEMO_HEATMAP.cells}
        total={DEMO_HEATMAP.total}
        weeks={DEMO_HEATMAP.weeks}
      />

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
