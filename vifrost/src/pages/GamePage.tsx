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
import "./GamePage.css";

export function GamePage() {
  const location = useLocation();
  const {
    username,
    sendScoreUpdate,
    sendRunCode,
    sendReady,
    sendSubmit,
    lastMessage,
  } = useOutletContext<AppOutletContext>();

  const gameData = location.state as GameStartPayload | null;

  const [editorValue, setEditorValue] = useState(gameData?.snippet ?? "");
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<boolean[] | null>(null);
  const [problemForceOpen, setProblemForceOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const infoBtnRef = useRef<HTMLButtonElement | null>(null);

  const match = useMatchState(gameData, lastMessage);
  const { attachVimModeListener, scoreExtension } = useKeybindListener(sendScoreUpdate);

  useEffect(() => {
    if (lastMessage?.type === "run_result") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI state with websocket event stream
      setRunResults(lastMessage.payload.results);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI state with websocket event stream
      setIsRunning(false);
    }
  }, [lastMessage]);

  const handleRun = useCallback(() => {
    if (match.phase !== "live" || match.submitted) return;
    setRunResults(null);
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

  return (
    <main className="game">
      <div className="game__stage">
        <MatchScoreboard
          ref={infoBtnRef}
          player={{
            name: username ?? "you",
            color: gameData.playerColor,
            pct: match.playerPct,
          }}
          opponent={{
            name: gameData.opponentName ?? "opponent",
            color: gameData.opponentColor,
            pct: match.opponentPct,
          }}
          onInfoClick={() => setPopoverOpen((v) => !v)}
          onReopenProblem={() => setProblemForceOpen(true)}
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
            onSubmit={handleSubmit}
            submitted={match.submitted}
          />
          <OpponentCodePanel
            starterCode={gameData.snippet}
            opponentName={gameData.opponentName ?? "opponent"}
          />
        </div>

        {match.phase === "ended" && match.winner && match.finalKeybindScores && (
          <MatchEndBanner
            winner={match.winner}
            playerName={username ?? "you"}
            opponentName={gameData.opponentName ?? "opponent"}
            playerPct={match.playerPct}
            opponentPct={match.opponentPct}
            playerKeybindScore={match.finalKeybindScores.player}
            opponentKeybindScore={match.finalKeybindScores.opponent}
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
