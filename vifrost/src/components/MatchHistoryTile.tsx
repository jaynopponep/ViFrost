import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../App";
import matchHistoryData from "../data/matchHistory.json";

type MatchRow = {
  opponent: string;
  matchLength: string;
  accuracy: number;
  result: "W" | "L";
};

function formatPercent(v: number) {
  return `${Math.round(v)}%`;
}

export function MatchHistoryTile() {
  const { username } = useOutletContext<AppOutletContext>();
  const safeName = username ?? "ArifMan";

  const matches: MatchRow[] = matchHistoryData as MatchRow[];

  const gamesPlayed = matches.length;
  const wins = matches.filter((m) => m.result === "W").length;
  const losses = gamesPlayed - wins;
  const winRate = gamesPlayed ? (wins / gamesPlayed) * 100 : 0;

  const best = matches.reduce((acc, m) => (m.accuracy > acc.accuracy ? m : acc), matches[0]);
  const bestAccuracy = best?.accuracy ?? 0;
  const bestOpponent = best?.opponent ?? "—";

  return (
    <section
      className="w-full rounded-2xl border p-6 lg:mx-auto lg:w-[80%]"
      style={{ borderColor: 'var(--colorBorder)', backgroundColor: 'var(--colorSurfaceAlt)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          className="text-lg font-semibold tracking-wide"
          style={{ color: 'var(--colorText)' }}
        >
          Match History
        </h2>

        <div
          className="rounded-md px-3 py-1 text-xs font-medium"
          style={{ color: 'var(--colorTextMuted)', backgroundColor: 'var(--colorSubtleBg)' }}
        >
          Latest games for {safeName}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: 'var(--colorSoftBorder)',
            backgroundColor: 'var(--colorStatCard)',
          }}
        >
          <div
            className="text-xs font-semibold tracking-widest"
            style={{ color: 'var(--colorTextMuted)' }}
          >
            GAMES PLAYED
          </div>
          <div className="mt-2 text-3xl font-bold" style={{ color: 'var(--colorText)' }}>
            {gamesPlayed}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--colorTextMuted)' }}>
            Last {gamesPlayed} ranked matches
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: 'var(--colorSoftBorder)',
            backgroundColor: 'var(--colorStatCard)',
          }}
        >
          <div
            className="text-xs font-semibold tracking-widest"
            style={{ color: 'var(--colorTextMuted)' }}
          >
            WIN RATE
          </div>
          <div className="mt-2 text-3xl font-bold" style={{ color: 'var(--colorText)' }}>
            {formatPercent(winRate)}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--colorTextMuted)' }}>
            {wins} wins · {losses} losses
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: 'var(--colorSoftBorder)',
            backgroundColor: 'var(--colorStatCard)',
          }}
        >
          <div
            className="text-xs font-semibold tracking-widest"
            style={{ color: 'var(--colorTextMuted)' }}
          >
            BEST ACCURACY
          </div>
          <div className="mt-2 text-3xl font-bold" style={{ color: 'var(--colorText)' }}>
            {formatPercent(bestAccuracy)}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--colorTextMuted)' }}>
            vs {bestOpponent}
          </div>
        </div>
      </div>

      <div
        className="mt-5 overflow-hidden rounded-xl border"
        style={{
          borderColor: 'var(--colorSoftBorder)',
          backgroundColor: 'var(--colorPanel)',
        }}
      >
        <div className="min-w-[760px]">
          <div
            className="grid grid-cols-[32px_1fr_160px_120px_88px] gap-x-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--colorTextMuted)' }}
          >
            <div>#</div>
            <div>Opponent</div>
            <div className="text-center">Match Length</div>
            <div className="text-center">Accuracy</div>
            <div className="text-right">Result</div>
          </div>

          <div>
            {matches.map((m, idx) => {
              const resultColor =
                m.result === "W" ? 'var(--colorAccent)' : 'var(--colorDanger)';
              return (
                <div
                  key={`${m.opponent}-${idx}`}
                  className="grid grid-cols-[32px_1fr_160px_120px_88px] items-center gap-x-3 px-4 py-3 text-sm"
                  style={{
                    ...(idx > 0
                      ? { borderTop: '1px solid var(--colorSoftBorder)' }
                      : {}),
                    ...(idx % 2 === 0
                      ? { backgroundColor: 'var(--colorZebra)' }
                      : {}),
                  }}
                >
                  <div style={{ color: 'var(--colorTextMuted)' }}>{idx + 1}</div>
                  <div className="font-medium" style={{ color: 'var(--colorText)' }}>
                    {m.opponent}
                  </div>
                  <div className="text-center" style={{ color: 'var(--colorTextMuted)' }}>
                    {m.matchLength}
                  </div>
                  <div className="text-center font-medium" style={{ color: 'var(--colorTextMuted)' }}>
                    {formatPercent(m.accuracy)}
                  </div>
                  <div
                    className="text-right font-semibold"
                    style={{ color: resultColor }}
                  >
                    {m.result}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
