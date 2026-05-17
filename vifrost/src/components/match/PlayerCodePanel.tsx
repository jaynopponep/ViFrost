import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { GameScreen } from "@/components/GameScreen";
import "./PlayerCodePanel.css";

export interface PlayerCodePanelProps {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  onCreateEditor: (view: EditorView) => void;
  scoreExtension: Extension[];
  onRun: () => void;
  isRunning: boolean;
  runResults: boolean[] | null;
}

export function PlayerCodePanel(props: PlayerCodePanelProps) {
  const {
    value,
    onChange,
    editable,
    onCreateEditor,
    scoreExtension,
    onRun,
    isRunning,
    runResults,
  } = props;

  return (
    <div className="player-panel">
      <div className="player-panel__editor">
        <GameScreen
          value={value}
          onChange={onChange}
          onCreateEditor={onCreateEditor}
          vimMode
          readOnly={!editable}
          height="100%"
          width="100%"
          theme="dark"
          extensions={scoreExtension}
        />
      </div>
      <div className="player-panel__footer">
        <button
          type="button"
          className="player-panel__run"
          onClick={onRun}
          disabled={!editable || isRunning}
        >
          {isRunning ? "Running…" : "Run"}
        </button>
        {runResults && (
          <div className="player-panel__results">
            {runResults.map((passed, i) => (
              <span
                key={i}
                className={`player-panel__result player-panel__result--${passed ? "pass" : "fail"}`}
              >
                T{i + 1} {passed ? "✓" : "✗"}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
