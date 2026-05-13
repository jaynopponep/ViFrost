import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "../ui/avatar"
import { OutcomeChip, type MatchOutcome } from "../ui/outcome-chip"
import { MatchDetail, type MatchStats } from "./MatchDetail"

export interface MatchRowData {
  id: string
  outcome: MatchOutcome
  mode: "Ranked" | "Casual"
  challenge: string
  opponent: string
  oppRating: number
  ratingChange: number
  you: MatchStats
  opp: MatchStats
  when: string
}

export interface MatchRowProps {
  match: MatchRowData
  expanded: boolean
  onToggle: () => void
  currentUser: string
}

const ROW_GRID =
  "grid grid-cols-[72px_260px_1fr_90px_80px_80px_24px] items-center gap-5 px-5 py-3.5"

export function MatchRow({ match, expanded, onToggle, currentUser }: MatchRowProps) {
  const changeColor =
    match.ratingChange > 0
      ? "var(--colorCyan)"
      : match.ratingChange < 0
      ? "var(--colorDanger)"
      : "var(--colorTextMuted)"

  return (
    <div
      className={cn(
        "mb-2 overflow-hidden rounded-[10px] border transition-colors",
        expanded
          ? "border-[color:var(--colorAccentBorder)] bg-[var(--colorStatCard)]"
          : "border-[color:var(--colorBorder)] bg-[var(--colorPanel)]",
      )}
    >
      <div onClick={onToggle} className={`${ROW_GRID} cursor-pointer`}>
        <OutcomeChip outcome={match.outcome} />

        <div>
          <div className="font-mono text-[13px] text-[var(--colorText)]">
            {match.challenge}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-[var(--colorTextMuted)]">
            {match.id} · {match.mode}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] text-[var(--colorTextMuted)]">
            vs
          </span>
          <Avatar name={match.opponent} size={26} />
          <div>
            <div className="font-mono text-[13px] text-[var(--colorText)]">
              {match.opponent}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-[var(--colorTextMuted)]">
              {match.oppRating} rating
            </div>
          </div>
        </div>

        <div
          className="text-right font-mono text-sm"
          style={{ color: changeColor }}
        >
          {match.ratingChange > 0 ? "+" : ""}
          {match.ratingChange}
        </div>
        <div className="text-right font-mono text-[13px] text-[var(--colorTextMuted)]">
          {match.you.keystrokes}k
        </div>
        <div className="text-right font-mono text-[13px] text-[var(--colorTextMuted)]">
          {match.when}
        </div>
        <div
          className="flex items-center justify-center text-[var(--colorTextMuted)]"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <ChevronRight size={14} />
        </div>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div
          className="overflow-hidden transition-opacity duration-200"
          style={{ opacity: expanded ? 1 : 0 }}
        >
          <MatchDetail
            outcome={match.outcome}
            currentUser={currentUser}
            opponent={match.opponent}
            oppRating={match.oppRating}
            you={match.you}
            opp={match.opp}
          />
        </div>
      </div>
    </div>
  )
}
