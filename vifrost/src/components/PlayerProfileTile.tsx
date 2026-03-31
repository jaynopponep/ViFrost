import { useNavigate } from "react-router-dom";
import { palette } from "../theme/theme";

export interface PlayerProfileTileProps {
  username: string;
}

export function PlayerProfileTile({ username }: PlayerProfileTileProps) {
  const initial = (username[0] ?? "A").toUpperCase();
  const navigate = useNavigate();
  const accentGradient = `linear-gradient(135deg, ${palette.colorAccent}, ${palette.colorAccentHover})`;
  const accentGradientHorizontal = `linear-gradient(90deg, ${palette.colorAccent}, ${palette.colorAccentHover})`;

  return (
    <section
      className="w-full rounded-2xl border p-6 lg:max-w-[390px]"
      style={{ borderColor: palette.colorBorder, backgroundColor: palette.colorSurfaceAlt }}
    >
      <h2
        className="text-lg font-semibold tracking-wide"
        style={{ color: palette.colorText }}
      >
        Player Profile
      </h2>

      <div className="mt-5 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-semibold"
          style={{
            color: palette.colorSurfaceAlt,
            backgroundImage: accentGradient,
          }}
        >
          {initial}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold" style={{ color: palette.colorText }}>
              {username}
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ color: palette.colorTextMuted, backgroundColor: palette.colorSubtleBg }}
            >
              Ranked - 1,482 MMR
            </span>
          </div>
          <span className="mt-1 text-xs" style={{ color: palette.colorTextMuted }}>
            Current user
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: palette.colorSoftBorder,
            backgroundColor: palette.colorStatCard,
          }}
        >
          <div
            className="text-xs font-semibold tracking-widest"
            style={{ color: palette.colorTextMuted }}
          >
            WINS
          </div>
          <div className="mt-2 text-3xl font-bold" style={{ color: palette.colorText }}>
            72
          </div>
          <div className="mt-1 text-xs" style={{ color: palette.colorTextMuted }}>
            Last 10: 7-3
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: palette.colorSoftBorder,
            backgroundColor: palette.colorStatCard,
          }}
        >
          <div
            className="text-xs font-semibold tracking-widest"
            style={{ color: palette.colorTextMuted }}
          >
            LOSSES
          </div>
          <div className="mt-2 text-3xl font-bold" style={{ color: palette.colorText }}>
            41
          </div>
          <div className="mt-1 text-xs" style={{ color: palette.colorTextMuted }}>
            Streak: 3 W
          </div>
        </div>
      </div>

      <div
        className="mt-5 rounded-xl border p-4"
        style={{
          borderColor: palette.colorSoftBorder,
          backgroundColor: palette.colorPanel,
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-semibold tracking-widest"
            style={{ color: palette.colorTextMuted }}
          >
            NEXT RANK: DIAMOND
          </div>
          <div className="text-xs font-semibold" style={{ color: palette.colorTextMuted }}>
            68%
          </div>
        </div>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: palette.colorSoftBorder }}
        >
          <div
            className="h-full w-[68%]"
            style={{ backgroundImage: accentGradientHorizontal }}
          />
        </div>

        <div className="mt-3 text-xs" style={{ color: palette.colorTextMuted }}>
          Win 3 more ranked games to promote.
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed" style={{ color: palette.colorTextMuted }}>
        Casual games are not counted toward your ranked MMR, but they still
        appear in your match history.
      </p>

      <button
        type="button"
        className="mt-3 text-left text-xs font-medium underline underline-offset-4"
        style={{ color: palette.colorTextMuted }}
        onClick={() => navigate("/match-history")}
      >
        View full match history &rarr;
      </button>
    </section>
  );
}
