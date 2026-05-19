import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GameScreen } from "../components/GameScreen";
import tutorialData from "../data/tutorialLevels.json";

const tutorialLevels = tutorialData.levels;
const VIM_CHEATSHEET = tutorialData.cheatsheet;
import "./TutorialPage.css";

const RUN_URL = "http://localhost:8080/run";

type Tab = "levels" | "scoring";

export function TutorialPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("levels");
  const [levelIdx, setLevelIdx] = useState(0);
  const [editorValue, setEditorValue] = useState(tutorialLevels[0].snippet);
  const [testResults, setTestResults] = useState<boolean[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [levelComplete, setLevelComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  const level = tutorialLevels[levelIdx];
  const isFirst = levelIdx === 0;
  const isLast = levelIdx === tutorialLevels.length - 1;

  const goToLevel = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(tutorialLevels.length - 1, idx));
    setLevelIdx(clamped);
    setEditorValue(tutorialLevels[clamped].snippet);
    setTestResults(null);
    setRunError(null);
    setLevelComplete(false);
    setShowHint(false);
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    setRunError(null);
    try {
      const res = await fetch(RUN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editorValue, tests: level.tests }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = (await res.json()) as {
        results: boolean[] | null;
        error?: string;
      };
      if (!data.results) {
        // the server responded but the code did not produce results (syntax
        // error, traceback, timeout). show that, not the cannot-reach message.
        setRunError(data.error ?? "Your code produced no test output.");
        setTestResults(null);
        return;
      }
      setTestResults(data.results);
      if (data.results.length > 0 && data.results.every(Boolean)) {
        setLevelComplete(true);
      }
    } catch {
      setRunError(
        "Cannot reach the server. Run: cd server && go run . — then try again."
      );
      setTestResults(null);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = testResults ? testResults.filter(Boolean).length : 0;
  const totalTests = testResults ? testResults.length : 0;

  return (
    <main className="tutorial">
      {/* Vim cheatsheet overlay */}
      {showCheatsheet && (
        <div
          className="cheatsheet-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setShowCheatsheet(false)}
        >
          <div className="cheatsheet-modal">
            <div className="cheatsheet-header">
              <h2 className="cheatsheet-title">Vim Cheat Sheet</h2>
              <button
                type="button"
                className="cheatsheet-close"
                onClick={() => setShowCheatsheet(false)}
              >
                ✕
              </button>
            </div>
            <div className="cheatsheet-grid">
              {VIM_CHEATSHEET.map((section) => (
                <div key={section.category} className="cheatsheet-section">
                  <h3 className="cheatsheet-section-title">{section.category}</h3>
                  {section.commands.map((cmd) => (
                    <div key={cmd.keys} className="cheatsheet-row">
                      <code className="cheatsheet-keys">{cmd.keys}</code>
                      <span className="cheatsheet-desc">{cmd.desc}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="tutorial-sidebar">
        <div className="tutorial-sidebar-tabs">
          <button
            type="button"
            className={`tutorial-tab${tab === "levels" ? " tutorial-tab--active" : ""}`}
            onClick={() => setTab("levels")}
          >
            Levels
          </button>
          <button
            type="button"
            className={`tutorial-tab${tab === "scoring" ? " tutorial-tab--active" : ""}`}
            onClick={() => setTab("scoring")}
          >
            Scoring
          </button>
        </div>

        {tab === "levels" ? (
          <>
            <nav className="tutorial-level-list">
              {tutorialLevels.map((l, i) => (
                <button
                  key={l.id}
                  type="button"
                  className={`tutorial-level-item${i === levelIdx ? " tutorial-level-item--active" : ""}`}
                  onClick={() => goToLevel(i)}
                >
                  <span className="tutorial-level-num">{l.id}</span>
                  <span className="tutorial-level-name">{l.title}</span>
                </button>
              ))}
            </nav>

            <button
              type="button"
              className="tutorial-cheatsheet-btn"
              onClick={() => setShowCheatsheet(true)}
            >
              ⌨ Vim Cheat Sheet
            </button>
          </>
        ) : (
          <div className="tutorial-scoring-panel">
            <p className="tutorial-scoring-intro">
              ViFrost rewards efficient Vim usage and fast problem solving.
            </p>

            <div className="tutorial-scoring-section">
              <h4 className="tutorial-scoring-heading">Points</h4>
              <div className="tutorial-scoring-row tutorial-scoring-row--pos">
                <span className="tutorial-scoring-pts">+400</span>
                <span>per test passed (first time only)</span>
              </div>
              <div className="tutorial-scoring-row tutorial-scoring-row--pos">
                <span className="tutorial-scoring-pts">+20</span>
                <span>navigation shortcuts — w, b, f{"{char}"}, {"{n}"}j</span>
              </div>
              <div className="tutorial-scoring-row tutorial-scoring-row--neg">
                <span className="tutorial-scoring-pts">−5</span>
                <span>cursor move in Normal mode (without a shortcut)</span>
              </div>
            </div>

            <div className="tutorial-scoring-section">
              <h4 className="tutorial-scoring-heading">Key Rules</h4>
              <ul className="tutorial-scoring-list">
                <li>Navigation shortcuts like <strong>w</strong>, <strong>b</strong>, <strong>f</strong>, and counted jumps earn <strong>+20</strong> each.</li>
                <li>Any other cursor movement in Normal mode costs <strong>−5 pts</strong>.</li>
                <li>First player to pass all tests wins.</li>
                <li>If time runs out, the player with the higher score wins.</li>
              </ul>
            </div>

            <div className="tutorial-scoring-section">
              <h4 className="tutorial-scoring-heading">Tip</h4>
              <p className="tutorial-scoring-tip">
                Use w/b to jump by word, f{"{char}"} to jump to a character, and {"{n}"}j/{"{n}"}k for counted
                line jumps — every navigation shortcut adds +20 to your score.
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          className="tutorial-back-home"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>
      </aside>

      {/* Main content */}
      <div className="tutorial-content">
        {/* Level header */}
        <div className="tutorial-level-header">
          <div className="tutorial-level-meta">
            <span className="tutorial-level-badge">Level {level.id}</span>
            <h1 className="tutorial-level-title">{level.title}</h1>
          </div>
          <div className="tutorial-nav-buttons">
            <button
              type="button"
              className="tutorial-nav-btn"
              onClick={() => goToLevel(levelIdx - 1)}
              disabled={isFirst}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="tutorial-nav-btn"
              onClick={() => goToLevel(levelIdx + 1)}
              disabled={isLast}
            >
              {levelComplete ? "Next →" : "Skip →"}
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="tutorial-description">{level.description}</p>

        {/* Vim commands for this level */}
        {level.vimCommands && (
          <div className="tutorial-vim-commands">
            <span className="tutorial-vim-commands-label">Commands used:</span>
            {level.vimCommands.map((cmd) => (
              <code key={cmd} className="tutorial-vim-cmd">{cmd}</code>
            ))}
          </div>
        )}

        {/* Hint toggle */}
        <div className="tutorial-hint-row">
          <button
            type="button"
            className="tutorial-hint-toggle"
            onClick={() => setShowHint((v) => !v)}
          >
            {showHint ? "Hide hint" : "Show hint"}
          </button>
          {showHint && <span className="tutorial-hint-text">{level.hint}</span>}
        </div>

        {/* Editor */}
        <div className="tutorial-editor-wrap">
          <GameScreen
            value={editorValue}
            onChange={setEditorValue}
            vimMode
            height="360px"
            width="700px"
            theme="dark"
          />
        </div>

        {/* Footer: test results + run button */}
        <div className="tutorial-footer">
          <div className="tutorial-results">
            {testResults && (
              <>
                <span className="tutorial-results-summary">
                  {passedCount}/{totalTests} tests passed
                </span>
                {testResults.map((passed, i) => (
                  <span
                    key={i}
                    className={`tutorial-result tutorial-result--${passed ? "pass" : "fail"}`}
                  >
                    T{i + 1} {passed ? "✓" : "✗"}
                  </span>
                ))}
              </>
            )}
            {runError && <span className="tutorial-run-error">{runError}</span>}
          </div>
          <button
            type="button"
            className="tutorial-run-btn"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>

        {/* Level complete banner */}
        {levelComplete && (
          <div className="tutorial-complete-banner">
            <span className="tutorial-complete-text">✓ All tests passed!</span>
            {isLast ? (
              <button
                type="button"
                className="tutorial-complete-btn"
                onClick={() => navigate("/")}
              >
                Finish Tutorial
              </button>
            ) : (
              <button
                type="button"
                className="tutorial-complete-btn"
                onClick={() => goToLevel(levelIdx + 1)}
              >
                Next Level →
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
