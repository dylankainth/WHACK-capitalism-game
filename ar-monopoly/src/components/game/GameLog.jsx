export function GameLog({ gameLog }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Game Log</h2>
            <div className="h-64 overflow-y-auto bg-gray-50 p-2 rounded-md text-xs font-mono space-y-1">
                {gameLog.map((msg, i) => <p key={i}>{msg}</p>)}
            </div>
        </div>
    );
}
