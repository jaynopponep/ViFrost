import globalLeaderboardData from "../data/globalLeaderboard.json";

export interface GlobalLeaderboardTileProps {
  currentUser: string;
}

type LeaderboardRow = {
  id: number;
  player: string;
  wins: number;
  losses: number;
  mmr: number;
  change: number;
};

const rows: LeaderboardRow[] = globalLeaderboardData as LeaderboardRow[];

const ROW_GRID =
  "grid grid-cols-[48px_1fr_52px_60px_108px_72px] gap-x-3 px-4 py-3";

function formatMmr(v: number) {
  return v.toLocaleString("en-US");
}

export function GlobalLeaderboardTile({
  currentUser,
}: GlobalLeaderboardTileProps) {
  return (
    <section className="w-full rounded-2xl border border-[color:var(--colorBorder)] bg-[var(--colorSurfaceAlt)] p-6 lg:max-w-[800px]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-wide text-[var(--colorText)]">
          Global Leaderboard
        </h2>
        <div className="rounded-md bg-[var(--colorSubtleBg)] px-3 py-1 text-xs font-medium text-[var(--colorTextMuted)]">
          Ranked - Season 4
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[color:var(--colorSoftBorder)] bg-[var(--colorPanel)]">
        <div
          className={`${ROW_GRID} text-xs font-semibold uppercase tracking-wider text-[var(--colorTextMuted)]`}
        >
          <div>#</div>
          <div>Player</div>
          <div className="text-center">W</div>
          <div className="text-center">L</div>
          <div className="text-center">MMR</div>
          <div className="text-right">Change</div>
        </div>

        <div className="divide-y divide-[color:var(--colorSoftBorder)]">
          {rows.map((r) => {
            const isYou = r.player === currentUser;
            const changeText = `${r.change >= 0 ? "+" : ""}${r.change}`;
            const changeColor =
              r.change >= 0 ? "var(--colorAccent)" : "var(--colorDanger)";

            return (
              <div
                key={r.id}
                className={`${ROW_GRID} items-center text-sm ${isYou ? "bg-[var(--colorSubtleBg)]" : ""}`}
              >
                <div className="text-[var(--colorTextMuted)]">{r.id}</div>
                <div className="font-medium text-[var(--colorText)]">
                  {r.player}
                  {isYou ? " (You)" : ""}
                </div>
                <div className="text-center text-[var(--colorTextMuted)]">
                  {r.wins}
                </div>
                <div className="text-center text-[var(--colorTextMuted)]">
                  {r.losses}
                </div>
                <div className="text-center font-medium text-[var(--colorTextMuted)]">
                  {formatMmr(r.mmr)}
                </div>
                <div
                  className="text-right font-semibold"
                  style={{ color: changeColor }}
                >
                  {changeText}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
