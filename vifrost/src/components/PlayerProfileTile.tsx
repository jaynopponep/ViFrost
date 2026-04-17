import { useNavigate } from "react-router-dom";

export interface PlayerProfileTileProps {
  username: string;
}

const STAT_CARD =
  "rounded-xl border border-[color:var(--colorSoftBorder)] bg-[var(--colorStatCard)] p-4";

const STAT_LABEL =
  "text-xs font-semibold tracking-widest text-[var(--colorTextMuted)]";

export function PlayerProfileTile({ username }: PlayerProfileTileProps) {
  const initial = (username[0] ?? "A").toUpperCase();
  const navigate = useNavigate();
  const accentGradient =
    "linear-gradient(135deg, var(--colorAccent), var(--colorAccentHover))";
  const accentGradientHorizontal =
    "linear-gradient(90deg, var(--colorAccent), var(--colorAccentHover))";

  return (
    <section className="w-full rounded-2xl border border-[color:var(--colorBorder)] bg-[var(--colorSurfaceAlt)] p-6 lg:max-w-[390px]">
      <h2 className="text-lg font-semibold tracking-wide text-[var(--colorText)]">
        Player Profile
      </h2>

      <div className="mt-5 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-semibold text-[var(--colorSurfaceAlt)]"
          style={{ backgroundImage: accentGradient }}
        >
          {initial}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-[var(--colorText)]">
              {username}
            </span>
            <span className="rounded-full bg-[var(--colorSubtleBg)] px-3 py-1 text-xs font-medium text-[var(--colorTextMuted)]">
              Ranked - 1,482 MMR
            </span>
          </div>
          <span className="mt-1 text-xs text-[var(--colorTextMuted)]">
            Current user
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className={STAT_CARD}>
          <div className={STAT_LABEL}>WINS</div>
          <div className="mt-2 text-3xl font-bold text-[var(--colorText)]">
            72
          </div>
          <div className="mt-1 text-xs text-[var(--colorTextMuted)]">
            Last 10: 7-3
          </div>
        </div>

        <div className={STAT_CARD}>
          <div className={STAT_LABEL}>LOSSES</div>
          <div className="mt-2 text-3xl font-bold text-[var(--colorText)]">
            41
          </div>
          <div className="mt-1 text-xs text-[var(--colorTextMuted)]">
            Streak: 3 W
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[color:var(--colorSoftBorder)] bg-[var(--colorPanel)] p-4">
        <div className="flex items-center justify-between">
          <div className={STAT_LABEL}>NEXT RANK: DIAMOND</div>
          <div className="text-xs font-semibold text-[var(--colorTextMuted)]">
            68%
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--colorSoftBorder)]">
          <div
            className="h-full w-[68%]"
            style={{ backgroundImage: accentGradientHorizontal }}
          />
        </div>

        <div className="mt-3 text-xs text-[var(--colorTextMuted)]">
          Win 3 more ranked games to promote.
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[var(--colorTextMuted)]">
        Casual games are not counted toward your ranked MMR, but they still
        appear in your match history.
      </p>

      <button
        type="button"
        className="mt-3 text-left text-xs font-medium text-[var(--colorTextMuted)] underline underline-offset-4"
        onClick={() => navigate("/match-history")}
      >
        View full match history &rarr;
      </button>
    </section>
  );
}
