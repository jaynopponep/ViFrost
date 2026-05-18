// TEMPORARY UI PREVIEW PAGE.
// standalone mirror of GamePage's match screen, driven by local state and a
// dev control strip instead of a live websocket match. lets the match ui be
// tuned without playing a real 1v1. delete this file and its /match-preview
// route in main.tsx once the design is finalized. nothing imports this in
// production paths.

import { useRef, useState } from "react";
import { useKeybindListener } from "../hooks/useKeybindListener";
import type { MatchPhase } from "../hooks/useMatchState";
import { ProblemDialog } from "../components/match/ProblemDialog";
import { MatchScoreboard } from "../components/match/MatchScoreboard";
import { TestDetailPopover } from "../components/match/TestDetailPopover";
import { PlayerCodePanel } from "../components/match/PlayerCodePanel";
import { OpponentCodePanel } from "../components/match/OpponentCodePanel";
import { MatchEndBanner } from "../components/match/MatchEndBanner";
import "./GamePage.css";

// stand-in for the GameStartPayload a real match would carry in router state.
const MOCK = {
  username: "you",
  opponentName: "rival",
  playerColor: "#7c5cff",
  opponentColor: "#ff5c8a",
  problemTitle: "reverse a linked list",
  problemStatement:
    "Fix the bug:\n\nThe function should reverse the list in place and\nreturn the new head. It currently drops the last node.",
  snippet: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr.next) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
};

// build a per-test boolean vector with the first `passed` entries true, which
// is exactly the shape the scoreboard / popover consume from useMatchState.
function testVector(passed: number, total: number): boolean[] {
  return Array.from({ length: total }, (_, i) => i < passed);
}

export function MatchPreviewPage() {
  const [phase, setPhase] = useState<MatchPhase>("live");
  const [totalTests, setTotalTests] = useState(5);
  const [playerPassed, setPlayerPassed] = useState(3);
  const [opponentPassed, setOpponentPassed] = useState(2);
  const [submitted, setSubmitted] = useState(false);
  const [winnerIsPlayer, setWinnerIsPlayer] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);

  const [editorValue, setEditorValue] = useState(MOCK.snippet);
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<boolean[] | null>(null);
  const [problemForceOpen, setProblemForceOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  // bump on "simulate win" so the end banner remounts and the win confetti
  // re-fires even when we're already on the ended phase.
  const [bannerKey, setBannerKey] = useState(0);

  // TEMPORARY: mock vim score + delta queue for design iteration
  const [playerVim, setPlayerVim] = useState(0);
  const [opponentVim, setOpponentVim] = useState(0);
  const [simDeltas, setSimDeltas] = useState<{ id: number; value: number }[]>(
    [],
  );
  const simIdRef = useRef(0);

  const fireDelta = (value: number) => {
    simIdRef.current += 1;
    const id = simIdRef.current;
    setSimDeltas((prev) => [...prev, { id, value }]);
    setPlayerVim((v) => v + value);
  };
  const dismissSimDelta = (id: number) =>
    setSimDeltas((prev) => prev.filter((d) => d.id !== id));

  const infoBtnRef = useRef<HTMLButtonElement | null>(null);

  // real editor extensions, with a no-op score sender (no websocket here).
  const { attachVimModeListener, scoreExtension } = useKeybindListener(() => {});

  const playerTests = testVector(playerPassed, totalTests);
  const opponentTests = testVector(opponentPassed, totalTests);
  const playerPct = totalTests === 0 ? 0 : (playerPassed / totalTests) * 100;
  const opponentPct =
    totalTests === 0 ? 0 : (opponentPassed / totalTests) * 100;

  // mirrors GamePage's dialog open / readonly derivation exactly.
  const dialogOpen =
    phase === "waiting" || phase === "countdown" || problemForceOpen;
  const dialogReadOnly = phase !== "waiting" && phase !== "countdown";

  // play the real pre-game sequence: countdown 3 -> 2 -> 1 -> live, so the
  // traffic-light colors and dialog transition can be watched without a match.
  const simulateCountdown = () => {
    setPhase("countdown");
    setCountdown(3);
    window.setTimeout(() => setCountdown(2), 1000);
    window.setTimeout(() => setCountdown(1), 2000);
    window.setTimeout(() => setPhase("live"), 3000);
  };

  // jump straight to the win screen (player victory) and force a banner
  // remount so the confetti flourish plays every press.
  const simulateWin = () => {
    setWinnerIsPlayer(true);
    setPhase("ended");
    setBannerKey((k) => k + 1);
  };

  const simulateRun = () => {
    setRunResults(null);
    setIsRunning(true);
    window.setTimeout(() => {
      setRunResults(testVector(playerPassed, totalTests));
      setIsRunning(false);
    }, 400);
  };

  return (
    <main className="game">
      <DevControls
        phase={phase}
        setPhase={setPhase}
        totalTests={totalTests}
        setTotalTests={setTotalTests}
        playerPassed={playerPassed}
        setPlayerPassed={setPlayerPassed}
        opponentPassed={opponentPassed}
        setOpponentPassed={setOpponentPassed}
        submitted={submitted}
        setSubmitted={setSubmitted}
        winnerIsPlayer={winnerIsPlayer}
        setWinnerIsPlayer={setWinnerIsPlayer}
        playerReady={playerReady}
        setPlayerReady={setPlayerReady}
        opponentReady={opponentReady}
        setOpponentReady={setOpponentReady}
        countdown={countdown}
        setCountdown={setCountdown}
        onSimulateRun={simulateRun}
        onSimulateWin={simulateWin}
        onSimulateCountdown={simulateCountdown}
        onFireDelta={fireDelta}
        onBumpOpponentVim={() => setOpponentVim((v) => v + 20)}
      />

      <div className="game__stage">
        <MatchScoreboard
          ref={infoBtnRef}
          player={{
            name: MOCK.username,
            color: MOCK.playerColor,
            pct: playerPct,
            vim: playerVim,
          }}
          opponent={{
            name: MOCK.opponentName,
            color: MOCK.opponentColor,
            pct: opponentPct,
            vim: opponentVim,
          }}
          onInfoClick={() => setPopoverOpen((v) => !v)}
          onReopenProblem={() => setProblemForceOpen(true)}
          vimDeltas={simDeltas}
          onDismissVimDelta={dismissSimDelta}
        />

        <div className="game__panels">
          <PlayerCodePanel
            value={editorValue}
            onChange={setEditorValue}
            editable={phase === "live" && !submitted}
            onCreateEditor={attachVimModeListener}
            scoreExtension={scoreExtension}
            onRun={simulateRun}
            isRunning={isRunning}
            runResults={runResults}
            runError={null}
            onSubmit={() => setSubmitted(true)}
            submitted={submitted}
          />
          <OpponentCodePanel
            starterCode={MOCK.snippet}
            opponentName={MOCK.opponentName}
          />
        </div>

        {phase === "ended" && (
          <MatchEndBanner
            key={bannerKey}
            winner={winnerIsPlayer ? "player" : "opponent"}
            playerName={MOCK.username}
            opponentName={MOCK.opponentName}
            playerPct={playerPct}
            opponentPct={opponentPct}
            playerKeybindScore={42}
            opponentKeybindScore={37}
          />
        )}
      </div>

      <ProblemDialog
        open={dialogOpen}
        problemTitle={MOCK.problemTitle}
        problemStatement={MOCK.problemStatement}
        playerReady={playerReady}
        opponentReady={opponentReady}
        countdown={phase === "countdown" ? countdown : null}
        onReadyClick={
          dialogReadOnly ? undefined : () => setPlayerReady(true)
        }
        onOpenChange={(open) => {
          if (!open) setProblemForceOpen(false);
        }}
      />

      <TestDetailPopover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        anchorRef={infoBtnRef}
        playerTests={playerTests}
        opponentTests={opponentTests}
        playerName={MOCK.username}
        opponentName={MOCK.opponentName}
      />
    </main>
  );
}

// fixed-position dev strip. intentionally unstyled-by-css (inline styles only)
// so it leaves zero footprint to clean up beyond deleting this file.
interface DevControlsProps {
  phase: MatchPhase;
  setPhase: (p: MatchPhase) => void;
  totalTests: number;
  setTotalTests: (n: number) => void;
  playerPassed: number;
  setPlayerPassed: (n: number) => void;
  opponentPassed: number;
  setOpponentPassed: (n: number) => void;
  submitted: boolean;
  setSubmitted: (b: boolean) => void;
  winnerIsPlayer: boolean;
  setWinnerIsPlayer: (b: boolean) => void;
  playerReady: boolean;
  setPlayerReady: (b: boolean) => void;
  opponentReady: boolean;
  setOpponentReady: (b: boolean) => void;
  countdown: number | null;
  setCountdown: (n: number) => void;
  onSimulateRun: () => void;
  onSimulateWin: () => void;
  onSimulateCountdown: () => void;
  onFireDelta: (value: number) => void;
  onBumpOpponentVim: () => void;
}

function DevControls(props: DevControlsProps) {
  const phases: MatchPhase[] = ["waiting", "countdown", "live", "ended"];
  // TEMPORARY: shared button style mirroring the existing simulate buttons
  const simBtn: React.CSSProperties = {
    marginLeft: 4,
    padding: "2px 6px",
    borderRadius: 4,
    border: "1px solid #555",
    cursor: "pointer",
    background: "transparent",
    color: "#eee",
  };
  const box: React.CSSProperties = {
    position: "fixed",
    bottom: 12,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    padding: "8px 14px",
    background: "rgba(15,15,20,0.92)",
    border: "1px solid #444",
    borderRadius: 10,
    color: "#eee",
    font: "12px/1.4 ui-monospace, monospace",
    boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
  };

  return (
    <div style={box}>
      <strong style={{ color: "#ff5c8a" }}>TEMP PREVIEW</strong>

      <span>
        phase:{" "}
        {phases.map((p) => (
          <button
            key={p}
            onClick={() => props.setPhase(p)}
            style={{
              marginLeft: 4,
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid #555",
              cursor: "pointer",
              background: props.phase === p ? "#7c5cff" : "transparent",
              color: "#eee",
            }}
          >
            {p}
          </button>
        ))}
      </span>

      <label>
        total{" "}
        <input
          type="number"
          min={0}
          max={20}
          value={props.totalTests}
          onChange={(e) => props.setTotalTests(Number(e.target.value))}
          style={{ width: 44 }}
        />
      </label>
      <label>
        you{" "}
        <input
          type="number"
          min={0}
          max={props.totalTests}
          value={props.playerPassed}
          onChange={(e) => props.setPlayerPassed(Number(e.target.value))}
          style={{ width: 44 }}
        />
      </label>
      <label>
        opp{" "}
        <input
          type="number"
          min={0}
          max={props.totalTests}
          value={props.opponentPassed}
          onChange={(e) => props.setOpponentPassed(Number(e.target.value))}
          style={{ width: 44 }}
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={props.submitted}
          onChange={(e) => props.setSubmitted(e.target.checked)}
        />{" "}
        submitted
      </label>
      <label>
        <input
          type="checkbox"
          checked={props.winnerIsPlayer}
          onChange={(e) => props.setWinnerIsPlayer(e.target.checked)}
        />{" "}
        you win
      </label>
      <label>
        <input
          type="checkbox"
          checked={props.playerReady}
          onChange={(e) => props.setPlayerReady(e.target.checked)}
        />{" "}
        you ready
      </label>
      <label>
        <input
          type="checkbox"
          checked={props.opponentReady}
          onChange={(e) => props.setOpponentReady(e.target.checked)}
        />{" "}
        opp ready
      </label>
      <label>
        cd{" "}
        <input
          type="number"
          min={0}
          max={9}
          value={props.countdown ?? 0}
          onChange={(e) => props.setCountdown(Number(e.target.value))}
          style={{ width: 36 }}
        />
      </label>

      <button
        onClick={props.onSimulateRun}
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid #555",
          cursor: "pointer",
          background: "transparent",
          color: "#eee",
        }}
      >
        simulate run
      </button>

      <button
        onClick={props.onSimulateWin}
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid #555",
          cursor: "pointer",
          background: "transparent",
          color: "#eee",
        }}
      >
        simulate win
      </button>

      {/* TEMPORARY: vim event simulators */}
      <span>
        vim event
        <button type="button" style={simBtn} onClick={() => props.onFireDelta(20)}>
          +20 nav
        </button>
        <button type="button" style={simBtn} onClick={() => props.onFireDelta(-5)}>
          -5 move
        </button>
        <button
          type="button"
          style={simBtn}
          onClick={() => props.onFireDelta(50)}
        >
          +50 macro
        </button>
        <button
          type="button"
          style={simBtn}
          onClick={() => props.onFireDelta(-100)}
        >
          -100 arrow
        </button>
        <button
          type="button"
          style={simBtn}
          onClick={() => props.onFireDelta(-200)}
        >
          -200 mouse
        </button>
        <button
          type="button"
          style={simBtn}
          onClick={() => props.onFireDelta(-60)}
        >
          -60 revert
        </button>
        <button type="button" style={simBtn} onClick={props.onBumpOpponentVim}>
          opp +20
        </button>
      </span>

      <button
        onClick={props.onSimulateCountdown}
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid #555",
          cursor: "pointer",
          background: "transparent",
          color: "#eee",
        }}
      >
        simulate countdown
      </button>
    </div>
  );
}
