import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function GamesPage() {
    const [user, setUser] = useState(null);
    const [games, setGames] = useState([]);
    const [loadingGames, setLoadingGames] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newGameName, setNewGameName] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });
    }, []);

    useEffect(() => {
        async function fetchGames() {
            setLoadingGames(true);
            setError(null);
            const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: false });
            if (error) setError(error.message);
            setGames(data || []);
            setLoadingGames(false);
        }
        fetchGames();
    }, []);

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error signing out:", error);
        } else {
            navigate("/");
        }
    }

    async function handleCreateGame(e) {
        e.preventDefault();
        setCreating(true);
        setError(null);
        const { data, error } = await supabase.from('games').insert({ name: newGameName }).select();
        if (error) {
            setError(error.message);
        } else {
            setGames([data[0], ...games]);
            setNewGameName("");
        }
        setCreating(false);
    }

    function handleJoinGame(gameId) {
        // Redirect to game page (replace with your game route)
        navigate(`/game/${gameId}`);
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-medium text-gray-800">
                            Available Games
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                User ID: {user?.id?.slice(0, 8)}...
                            </span>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-sm hover:bg-gray-300 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleCreateGame} className="mb-8 flex gap-4 items-center">
                        <input
                            type="text"
                            value={newGameName}
                            onChange={e => setNewGameName(e.target.value)}
                            placeholder="New game name"
                            className="border border-gray-300 rounded px-4 py-2 flex-1"
                            required
                        />
                        <button
                            type="submit"
                            disabled={creating || !newGameName}
                            className="bg-blue-600 text-white px-6 py-2 rounded-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {creating ? "Creating..." : "Create Game"}
                        </button>
                    </form>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {loadingGames ? (
                        <div className="text-gray-500">Loading games...</div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {games.length === 0 ? (
                                <div className="col-span-full text-gray-500">No games found. Create one above!</div>
                            ) : (
                                games.map(game => (
                                    <div key={game.id} className="bg-gray-50 rounded-sm border border-gray-200 p-6 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xl font-medium text-gray-800 mb-2">
                                                {game.name || `Game #${game.id}`}
                                            </h3>
                                            <p className="text-gray-600 mb-4 text-sm">
                                                Created: {new Date(game.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleJoinGame(game.id)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-sm font-medium hover:bg-blue-700 transition-colors mt-2"
                                        >
                                            Join Game
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}