import { useNavigate } from "react-router-dom";

export interface PlayerProfileTileProps {
  username: string;
}

export function PlayerProfileTile({ username }: PlayerProfileTileProps) {
  const initial = (username[0] ?? "A").toUpperCase();
  const navigate = useNavigate();
  const accentGradient = 'linear-gradient(135deg, var(--colorAccent), var(--colorAccentHover))';
  const accentGradientHorizontal = 'linear-gradient(90deg, var(--colorAccent), var(--colorAccentHover))';

  return (
    <section
      className="w-full rounded-2xl border p-6 lg:max-w-[390px]"
      style={{ borderColor: 'var(--colorBorder)', backgroundColor: 'var(--colorSurfaceAlt)' }}
    >
      <h2
        className="text-lg font-semibold tracking-wide"
        style={{ color: 'var(--colorText)' }}
      >
        Player Profile
      </h2>

      <div className="mt-5 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-semibold"
          style={{
            color: 'var(--colorSurfaceAlt)',
            backgroundImage: accentGradient,
          }}
        >
          {initial}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold" style={{ color: 'var(--colorText)' }}>
              {username}
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ color: 'var(--colorTextMuted)', backgroundColor: 'var(--colorSubtleBg)' }}
            >
              Ranked - 1,482 MMR
            </span>
          </div>
          <span className="mt-1 text-xs" style={{ color: 'var(--colorTextMuted)' }}>
            Current user
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
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
            WINS
          </div>
          <div className="mt-2 text-3xl font-bold" style={{ color: 'var(--colorText)' }}>
            72
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--colorTextMuted)' }}>
            Last 10: 7-3
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
            LOSSES
          </div>
          <div className="mt-2 text-3xl font-bold" style={{ color: 'var(--colorText)' }}>
            41
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--colorTextMuted)' }}>
            Streak: 3 W
          </div>
        </div>
      </div>

      <div
        className="mt-5 rounded-xl border p-4"
        style={{
          borderColor: 'var(--colorSoftBorder)',
          backgroundColor: 'var(--colorPanel)',
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-semibold tracking-widest"
            style={{ color: 'var(--colorTextMuted)' }}
          >
            NEXT RANK: DIAMOND
          </div>
          <div className="text-xs font-semibold" style={{ color: 'var(--colorTextMuted)' }}>
            68%
          </div>
        </div>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--colorSoftBorder)' }}
        >
          <div
            className="h-full w-[68%]"
            style={{ backgroundImage: accentGradientHorizontal }}
          />
        </div>

        <div className="mt-3 text-xs" style={{ color: 'var(--colorTextMuted)' }}>
          Win 3 more ranked games to promote.
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed" style={{ color: 'var(--colorTextMuted)' }}>
        Casual games are not counted toward your ranked MMR, but they still
        appear in your match history.
      </p>

      <button
        type="button"
        className="mt-3 text-left text-xs font-medium underline underline-offset-4"
        style={{ color: 'var(--colorTextMuted)' }}
        onClick={() => navigate("/match-history")}
      >
        View full match history &rarr;
      </button>
    </section>
  );
}
