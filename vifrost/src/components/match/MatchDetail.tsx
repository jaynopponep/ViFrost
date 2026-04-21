import { cn } from "@/lib/utils"

export interface MatchStats {
  keystrokes: number
  time: number
  wpm: number
}

export interface MatchDetailProps {
  outcome: "W" | "L" | "D"
  currentUser: string
  opponent: string
  oppRating: number
  you: MatchStats
  opp: MatchStats
}

function Stat({
  label,
  a,
  b,
  aWins,
}: {
  label: string
  a: string | number
  b: string | number
  aWins: boolean
}) {
  return (
    <div className="grid grid-cols-[1fr_100px_1fr] items-center gap-3 py-1.5">
      <div
        className={cn(
          "text-right font-mono text-[13px]",
          aWins ? "text-[var(--colorCyan)]" : "text-[var(--colorText)]",
        )}
      >
        {a}
      </div>
      <div className="text-center font-mono text-[10px] tracking-[0.08em] text-[var(--colorTextMuted)]">
        {label}
      </div>
      <div
        className={cn(
          "text-left font-mono text-[13px]",
          !aWins ? "text-[var(--colorCyan)]" : "text-[var(--colorText)]",
        )}
      >
        {b}
      </div>
    </div>
  )
}

export function MatchDetail({
  outcome,
  currentUser,
  opponent,
  oppRating,
  you,
  opp,
}: MatchDetailProps) {
  const youWins = outcome === "W"
  const oppWins = outcome === "L"

  return (
    <div className="border-t border-[color:var(--colorBorder)] bg-[var(--colorStatCard)] px-6 pb-[22px] pt-[18px]">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-5 border-b border-[color:var(--colorBorder)] pb-3.5 mb-3.5">
        <div className="text-right">
          <div
            className={cn(
              "font-mono text-sm",
              youWins ? "text-[var(--colorCyan)]" : "text-[var(--colorText)]",
            )}
          >
            {currentUser} {youWins && "·"}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-[var(--colorTextMuted)]">
            you
          </div>
        </div>
        <div className="self-center font-mono text-[11px] text-[var(--colorTextMuted)]">
          vs
        </div>
        <div>
          <div
            className={cn(
              "font-mono text-sm",
              oppWins ? "text-[var(--colorCyan)]" : "text-[var(--colorText)]",
            )}
          >
            {oppWins && "·"} {opponent}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-[var(--colorTextMuted)]">
            {oppRating}
          </div>
        </div>
      </div>

      <Stat
        label="KEYSTROKES"
        a={you.keystrokes}
        b={opp.keystrokes}
        aWins={you.keystrokes < opp.keystrokes}
      />
      <Stat
        label="TIME"
        a={`${you.time}s`}
        b={`${opp.time}s`}
        aWins={you.time < opp.time}
      />
      <Stat label="WPM" a={you.wpm} b={opp.wpm} aWins={you.wpm > opp.wpm} />

      <div className="mt-4 flex justify-center gap-2.5">
        <button
          type="button"
          onClick={() => {}}
          className="cursor-pointer rounded-[5px] border px-3.5 py-[7px] font-mono text-[12px]"
          style={{
            backgroundColor: "var(--colorAccentSoft)",
            borderColor: "var(--colorAccentBorder)",
            color: "var(--colorCyan)",
          }}
        >
          ▶ Replay
        </button>
        <button
          type="button"
          onClick={() => {}}
          className="cursor-pointer rounded-[5px] border border-[color:var(--colorBorder)] px-3.5 py-[7px] font-mono text-[12px] text-[var(--colorTextMuted)]"
        >
          View solution
        </button>
        <button
          type="button"
          onClick={() => {}}
          className="cursor-pointer rounded-[5px] border border-[color:var(--colorBorder)] px-3.5 py-[7px] font-mono text-[12px] text-[var(--colorTextMuted)]"
        >
          Rematch
        </button>
      </div>
    </div>
  )
}
