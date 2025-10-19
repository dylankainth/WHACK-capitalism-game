import { PlayerStats } from "./PlayerStats";

export function PlayerList({ players, playerDetails }) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-3">Players</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {players.map(p => (
                    <PlayerStats
                        key={p.id}
                        player={p}
                        money={playerDetails[p.id]?.money}
                        score={playerDetails[p.id]?.score}
                    />
                ))}
            </div>
        </div>
    );
}
