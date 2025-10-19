import { useNavigate } from "react-router-dom";

export function GameInfo({ game }) {
    const navigate = useNavigate();
    return (
        <div>
            <button
                className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                onClick={() => navigate('/games')}
            >
                ← Back to Games
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{game.name}</h1>
            <p className="text-gray-500">Board Size: {game.board_size}</p>
        </div>
    );
}
