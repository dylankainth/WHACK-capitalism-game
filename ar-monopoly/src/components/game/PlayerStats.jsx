export function PlayerStats({ player, money, score }) {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-lg text-gray-800">{player.name}</h3>
            <p className="text-sm text-gray-500 mb-2">({player.type})</p>
            <div className="space-y-1 text-sm">
                <p><strong>Money:</strong> <span className="font-mono">${money ?? '...'}</span></p>
                <p><strong>Score:</strong> <span className="font-mono">{score ?? '...'}</span></p>
                <p><strong>Position:</strong> <span className="font-mono">{player.location_idx}</span></p>
                <p><strong>Turns:</strong> <span className="font-mono">{player.turns}</span></p>
            </div>
        </div>
    );
}
