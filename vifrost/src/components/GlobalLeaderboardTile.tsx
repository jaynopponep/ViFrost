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

function formatMmr(v: number) {
  return v.toLocaleString("en-US");
}

export function GlobalLeaderboardTile({
  currentUser,
}: GlobalLeaderboardTileProps) {
  return (
    <section
      className="w-full rounded-2xl border p-6 lg:max-w-[800px]"
      style={{ borderColor: 'var(--colorBorder)', backgroundColor: 'var(--colorSurfaceAlt)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          className="text-lg font-semibold tracking-wide"
          style={{ color: 'var(--colorText)' }}
        >
          Global Leaderboard
        </h2>
        <div
          className="rounded-md px-3 py-1 text-xs font-medium"
          style={{ color: 'var(--colorTextMuted)', backgroundColor: 'var(--colorSubtleBg)' }}
        >
          Ranked - Season 4
        </div>
      </div>

      <div
        className="mt-5 overflow-hidden rounded-xl border"
        style={{
          borderColor: 'var(--colorSoftBorder)',
          backgroundColor: 'var(--colorPanel)',
        }}
      >
        <div
          className="grid grid-cols-[48px_1fr_52px_60px_108px_72px] gap-x-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--colorTextMuted)' }}
        >
          <div>#</div>
          <div>Player</div>
          <div className="text-center">W</div>
          <div className="text-center">L</div>
          <div className="text-center">MMR</div>
          <div className="text-right">Change</div>
        </div>

        <div>
          {rows.map((r, idx) => {
            const isYou = r.player === currentUser;
            const changeText = `${r.change >= 0 ? "+" : ""}${r.change}`;
            const changeColor =
              r.change >= 0 ? 'var(--colorAccent)' : 'var(--colorDanger)';

            return (
              <div
                key={r.id}
                className="grid grid-cols-[48px_1fr_52px_60px_108px_72px] items-center gap-x-3 px-4 py-3 text-sm"
                style={{
                  ...(idx > 0
                    ? { borderTop: '1px solid var(--colorSoftBorder)' }
                    : {}),
                  ...(isYou ? { backgroundColor: 'var(--colorSubtleBg)' } : {}),
                }}
              >
                <div style={{ color: 'var(--colorTextMuted)' }}>{r.id}</div>
                <div className="font-medium" style={{ color: 'var(--colorText)' }}>
                  {r.player}
                  {isYou ? " (You)" : ""}
                </div>
                <div className="text-center" style={{ color: 'var(--colorTextMuted)' }}>
                  {r.wins}
                </div>
                <div className="text-center" style={{ color: 'var(--colorTextMuted)' }}>
                  {r.losses}
                </div>
                <div
                  className="text-center font-medium"
                  style={{ color: 'var(--colorTextMuted)' }}
                >
                  {formatMmr(r.mmr)}
                </div>
                <div className="text-right font-semibold" style={{ color: changeColor }}>
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
