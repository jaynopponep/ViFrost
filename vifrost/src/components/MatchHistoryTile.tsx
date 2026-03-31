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
    <section className="w-full rounded-2xl border border-[var(--colorBorder)] bg-[var(--colorSurfaceAlt)] p-6 lg:w-[80%] lg:mx-auto">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-wide text-[var(--colorText)]">
          Match History
        </h2>

        <div className="rounded-md bg-[color-mix(in_oklab,var(--colorText)_8%,transparent)] px-3 py-1 text-xs font-medium text-[var(--colorTextMuted)]">
          Latest games for {safeName}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--colorText)_10%,transparent)] bg-[color-mix(in_oklab,var(--colorSurfaceAlt)_65%,var(--colorMain)_35%)] p-4">
          <div className="text-xs font-semibold tracking-widest text-[var(--colorTextMuted)]">
            GAMES PLAYED
          </div>
          <div className="mt-2 text-3xl font-bold text-[var(--colorText)]">
            {gamesPlayed}
          </div>
          <div className="mt-1 text-xs text-[var(--colorTextMuted)]">
            Last {gamesPlayed} ranked matches
          </div>
        </div>

        <div className="rounded-xl border border-[color-mix(in_oklab,var(--colorText)_10%,transparent)] bg-[color-mix(in_oklab,var(--colorSurfaceAlt)_65%,var(--colorMain)_35%)] p-4">
          <div className="text-xs font-semibold tracking-widest text-[var(--colorTextMuted)]">
            WIN RATE
          </div>
          <div className="mt-2 text-3xl font-bold text-[var(--colorText)]">
            {formatPercent(winRate)}
          </div>
          <div className="mt-1 text-xs text-[var(--colorTextMuted)]">
            {wins} wins · {losses} losses
          </div>
        </div>

        <div className="rounded-xl border border-[color-mix(in_oklab,var(--colorText)_10%,transparent)] bg-[color-mix(in_oklab,var(--colorSurfaceAlt)_65%,var(--colorMain)_35%)] p-4">
          <div className="text-xs font-semibold tracking-widest text-[var(--colorTextMuted)]">
            BEST ACCURACY
          </div>
          <div className="mt-2 text-3xl font-bold text-[var(--colorText)]">
            {formatPercent(bestAccuracy)}
          </div>
          <div className="mt-1 text-xs text-[var(--colorTextMuted)]">
            vs {bestOpponent}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[color-mix(in_oklab,var(--colorText)_10%,transparent)] bg-[color-mix(in_oklab,var(--colorSurfaceAlt)_55%,var(--colorMain)_45%)]">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[32px_1fr_160px_120px_88px] gap-x-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--colorTextMuted)]">
            <div>#</div>
            <div>Opponent</div>
            <div className="text-center">Match Length</div>
            <div className="text-center">Accuracy</div>
            <div className="text-right">Result</div>
          </div>

          <div className="divide-y divide-[color-mix(in_oklab,var(--colorText)_10%,transparent)]">
            {matches.map((m, idx) => {
              const resultColor =
                m.result === "W" ? "text-[var(--colorAccent)]" : "text-[var(--colorDanger)]";
              return (
                <div
                  key={`${m.opponent}-${idx}`}
                  className={[
                    "grid grid-cols-[32px_1fr_160px_120px_88px] gap-x-3 px-4 py-3 items-center text-sm",
                    idx % 2 === 0 ? "bg-[color-mix(in_oklab,var(--colorText)_6%,transparent)]" : "bg-transparent",
                  ].join(" ")}
                >
                  <div className="text-[var(--colorTextMuted)]">{idx + 1}</div>
                  <div className="font-medium text-[var(--colorText)]">{m.opponent}</div>
                  <div className="text-center text-[var(--colorTextMuted)]">{m.matchLength}</div>
                  <div className="text-center font-medium text-[var(--colorTextMuted)]">
                    {formatPercent(m.accuracy)}
                  </div>
                  <div className={`text-right font-semibold ${resultColor}`}>{m.result}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
