import { GameScreen } from "@/components/GameScreen";
import { useIsDarkTheme } from "@/hooks/useIsDarkTheme";
import { vifrostDarkTheme } from "@/theme/codemirrorTheme";
import "./OpponentCodePanel.css";

export interface OpponentCodePanelProps {
  starterCode: string;
  opponentName: string;
}

export function OpponentCodePanel(props: OpponentCodePanelProps) {
  const { starterCode, opponentName } = props;

  const isDark = useIsDarkTheme();

  if (!starterCode) {
    return (
      <div className="opp-panel" aria-label={`${opponentName}'s code (hidden)`}>
        <div className="opp-panel__empty">no snippet</div>
      </div>
    );
  }

  return (
    <div className="opp-panel" aria-label={`${opponentName}'s code (blurred)`}>
      <div className="opp-panel__blur">
        <GameScreen
          value={starterCode}
          onChange={() => {}}
          readOnly
          vimMode={false}
          height="100%"
          width="100%"
          theme={isDark ? vifrostDarkTheme : "light"}
        />
      </div>
    </div>
  );
}
