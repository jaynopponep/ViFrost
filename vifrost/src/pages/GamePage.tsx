import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, Navigate, useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../App";
import type { GameStartPayload } from "../hooks/useWebSocket";
import { useMatchState } from "../hooks/useMatchState";
import { useKeybindListener } from "../hooks/useKeybindListener";
import { ProblemDialog } from "../components/match/ProblemDialog";
import { MatchScoreboard } from "../components/match/MatchScoreboard";
import { TestDetailPopover } from "../components/match/TestDetailPopover";
import { PlayerCodePanel } from "../components/match/PlayerCodePanel";
import { OpponentCodePanel } from "../components/match/OpponentCodePanel";
import { MatchEndBanner } from "../components/match/MatchEndBanner";
import { matchEndStyleScores } from "../components/match/matchEndStats";
import "./GamePage.css";

export function GamePage() {
  const location = useLocation();
  const {
    username,
    sendKeybindEvent,
    sendRunCode,
    sendReady,
    sendSubmit,
    lastMessage,
    wsStatus,
  } = useOutletContext<AppOutletContext>();

  const gameData = location.state as GameStartPayload | null;

  const [editorValue, setEditorValue] = useState(gameData?.snippet ?? "");
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<boolean[] | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [problemForceOpen, setProblemForceOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const infoBtnRef = useRef<HTMLButtonElement | null>(null);

  const match = useMatchState(gameData, lastMessage);
  const {
    attachVimModeListener,
    scoreExtension,
    vimDeltas,
    dismissVimDelta,
  } = useKeybindListener(
    sendKeybindEvent,
    match.phase === "live" && !match.submitted,
  );

  useEffect(() => {
    if (lastMessage?.type === "run_result") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI state with websocket event stream
      setRunResults(lastMessage.payload.results);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI state with websocket event stream
      setRunError(lastMessage.payload.error ?? null);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI state with websocket event stream
      setIsRunning(false);
    }
  }, [lastMessage]);

  useEffect(() => {
    // a run only clears isRunning via run_result. if the match ends or the
    // socket drops mid-run that frame never arrives, so clear it here too,
    // otherwise the run button stays disabled until a reload.
    if (match.phase === "ended" || wsStatus !== "open") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI state with match/socket lifecycle
      setIsRunning(false);
    }
  }, [match.phase, wsStatus]);

  const handleRun = useCallback(() => {
    if (match.phase !== "live" || match.submitted) return;
    setRunResults(null);
    setRunError(null);
    setIsRunning(true);
    sendRunCode(editorValue);
  }, [match.phase, match.submitted, sendRunCode, editorValue]);

  const { markPlayerReady, markSubmitted } = match;
  const handleReadyClick = useCallback(() => {
    markPlayerReady();
    sendReady();
  }, [markPlayerReady, sendReady]);

  const handleSubmit = useCallback(() => {
    if (match.phase !== "live" || match.submitted) return;
    markSubmitted();
    sendSubmit();
  }, [match.phase, match.submitted, markSubmitted, sendSubmit]);

  if (!gameData) {
    return <Navigate to="/" replace />;
  }

  const problemTitle = gameData.problemTitle ?? "Untitled problem";
  const problemStatement =
    gameData.problemStatement ?? `Fix the bug:\n\n${gameData.snippet}`;

  const dialogOpen =
    match.phase === "waiting" ||
    match.phase === "countdown" ||
    problemForceOpen;

  const dialogReadOnly = match.phase !== "waiting" && match.phase !== "countdown";

  // per-player accumulated style for the end banner, identical to the live
  // scoreboard's vim figure (never the comparative keybind bonus).
  const endStyle =
    match.phase === "ended" && match.winner
      ? matchEndStyleScores({
          playerVim: match.playerVim,
          opponentVim: match.opponentVim,
        })
      : null;

  return (
    <main className="game">
      <div className="game__stage">
        <MatchScoreboard
          ref={infoBtnRef}
          player={{
            name: username ?? "you",
            color: gameData.playerColor,
            pct: match.playerPct,
            // both vim figures are derived from the server-authoritative
            // score (see deriveVim), so a client cannot inflate its own.
            vim: match.playerVim,
          }}
          opponent={{
            name: gameData.opponentName ?? "opponent",
            color: gameData.opponentColor,
            pct: match.opponentPct,
            vim: match.opponentVim,
          }}
          onInfoClick={() => setPopoverOpen((v) => !v)}
          onReopenProblem={() => setProblemForceOpen(true)}
          vimDeltas={vimDeltas}
          onDismissVimDelta={dismissVimDelta}
        />

        <div className="game__panels">
          <PlayerCodePanel
            value={editorValue}
            onChange={setEditorValue}
            editable={match.phase === "live" && !match.submitted}
            onCreateEditor={attachVimModeListener}
            scoreExtension={scoreExtension}
            onRun={handleRun}
            isRunning={isRunning}
            runResults={runResults}
            runError={runError}
            onSubmit={handleSubmit}
            submitted={match.submitted}
          />
          <OpponentCodePanel
            starterCode={gameData.snippet}
            opponentName={gameData.opponentName ?? "opponent"}
          />
        </div>

        {endStyle && match.winner && (
          <MatchEndBanner
            winner={match.winner}
            playerName={username ?? "you"}
            opponentName={gameData.opponentName ?? "opponent"}
            playerPct={match.playerPct}
            opponentPct={match.opponentPct}
            playerStyle={endStyle.player}
            opponentStyle={endStyle.opponent}
          />
        )}
      </div>

      <ProblemDialog
        open={dialogOpen}
        problemTitle={problemTitle}
        problemStatement={problemStatement}
        playerReady={match.playerReady}
        opponentReady={match.opponentReady}
        countdown={match.countdown}
        onReadyClick={dialogReadOnly ? undefined : handleReadyClick}
        onOpenChange={(open) => {
          if (!open) setProblemForceOpen(false);
        }}
      />

      <TestDetailPopover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        anchorRef={infoBtnRef}
        playerTests={match.playerTests}
        opponentTests={match.opponentTests}
        playerName={username ?? "you"}
        opponentName={gameData.opponentName ?? "opponent"}
      />
    </main>
  );
}
