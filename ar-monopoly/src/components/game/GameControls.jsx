export function GameControls({ isMyTurn, currentPlayer, handleRollAndMove, handleEndTurn, handleLeaveGame, activeModalLocation }) {
    return (
        <div className="bg-white border-2 border-blue-500 rounded-lg p-4 space-y-4">
            <h2 className="text-xl font-bold text-center">
                {isMyTurn ? "Your Turn!" : `Waiting for ${currentPlayer?.name || 'player'}...`}
            </h2>
            <div className="flex flex-col gap-3">
                <button
                    onClick={handleRollAndMove}
                    disabled={!isMyTurn || !!activeModalLocation}
                    className="bg-blue-600 text-white px-4 py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Roll & Move
                </button>
                <button
                    onClick={handleEndTurn}
                    disabled={!isMyTurn || !!activeModalLocation}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    End Turn
                </button>
                <button
                    onClick={handleLeaveGame}
                    className="w-full text-center text-sm text-red-600 hover:underline mt-2"
                >
                    Leave Game
                </button>
            </div>
        </div>
    );
}
