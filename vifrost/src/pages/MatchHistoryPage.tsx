import { MatchHistoryTile } from "../components/MatchHistoryTile";

export function MatchHistoryPage() {
  return (
    <main className="w-full px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
        <MatchHistoryTile />
      </div>
    </main>
  );
}
