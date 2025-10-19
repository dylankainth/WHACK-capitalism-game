export function JoinGameForm({ handleJoinGame, joinName, setJoinName, joining, joinError }) {
    return (
        <form onSubmit={handleJoinGame} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">Join as player:</label>
            <input
                type="text"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                placeholder="Your name"
                disabled={joining}
            />
            <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={joining}
            >
                {joining ? "Joining..." : "Join Game"}
            </button>
            {joinError && <span className="text-red-600 text-sm">{joinError}</span>}
        </form>
    );
}
