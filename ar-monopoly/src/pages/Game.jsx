import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function GamePage() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [players, setPlayers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [actions, setActions] = useState({}); // { locationId: [action, ...] }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);
    const [joinName, setJoinName] = useState("");
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        async function fetchGameData() {
            setLoading(true);
            setError(null);
            try {
                // Fetch game info
                const { data: gameData, error: gameError } = await supabase
                    .from("games")
                    .select("*")
                    .eq("id", gameId)
                    .single();
                if (gameError) throw gameError;
                setGame(gameData);

                // Fetch players
                const { data: playerData, error: playerError } = await supabase
                    .from("players")
                    .select("*")
                    .eq("game_id", gameId);
                if (playerError) throw playerError;
                setPlayers(playerData);

                // Fetch locations
                const { data: locationData, error: locationError } = await supabase
                    .from("locations")
                    .select("*")
                    .eq("game_id", gameId)
                    .order("board_index");
                if (locationError) throw locationError;
                setLocations(locationData);

                // Fetch actions for all locations
                const { data: locActs, error: locActsError } = await supabase
                    .from("location_actions")
                    .select("location_id,actions:action_id(*)");
                if (locActsError) throw locActsError;
                // Map location_id -> [actions]
                const actsMap = {};
                for (const la of locActs) {
                    if (!actsMap[la.location_id]) actsMap[la.location_id] = [];
                    actsMap[la.location_id].push(la.actions);
                }
                setActions(actsMap);
            } catch (err) {
                setError(err.message || "Failed to load game data");
            } finally {
                setLoading(false);
            }
        }
        fetchGameData();
    }, [gameId]);

    useEffect(() => {
        // Get current user id from supabase session
        async function fetchUser() {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) throw error;
                //console.log("Current user:", data?.user);
                setUserId(data?.user?.id || null);
            } catch (err) {
                console.error("Failed to get user:", err);
                setUserId(null);
            }
        }
        fetchUser();
    }, []);

    async function handleJoinGame(e) {
        e.preventDefault();
        setJoining(true);
        setJoinError(null);
        try {
            if (!joinName.trim()) {
                setJoinError("Please enter your name.");
                setJoining(false);
                return;
            }
            // Check if name already exists for this game
            const { data: existing, error: existErr } = await supabase
                .from("players")
                .select("id")
                .eq("game_id", gameId)
                .eq("name", joinName.trim())
                .maybeSingle();
            if (existErr) throw existErr;
            if (existing) {
                setJoinError("A player with that name already exists in this game.");
                setJoining(false);
                return;
            }
            // Add player
            const { error: insertErr } = await supabase
                .from("players")
                .insert({ game_id: gameId, name: joinName.trim(), type: "HUMAN", user_id: userId || null });
            if (insertErr) throw insertErr;
            setJoinName("");
            // Refresh players list
            const { data: playerData } = await supabase
                .from("players")
                .select("*")
                .eq("game_id", gameId);
            setPlayers(playerData);
        } catch (err) {
            setJoinError(err.message || "Failed to join game");
        } finally {
            setJoining(false);
        }
    }

    async function handleLeaveGame() {
        if (!userId) return;
        // Remove player with this name and gameId (assuming name is unique per game)
        // We'll use the supabase user id as the name for uniqueness if available
        // But for now, let's let the user leave by deleting their player row if their name matches the session user id or name
        // (You may want to store the mapping more robustly in production)
        const myPlayer = players.find(p => p.name === userId || p.user_id === userId);
        if (!myPlayer) return;
        const { error: delErr } = await supabase
            .from("players")
            .delete()
            .eq("id", myPlayer.id);
        if (delErr) {
            alert("Failed to leave game: " + delErr.message);
            return;
        }
        // Refresh players list
        const { data: playerData } = await supabase
            .from("players")
            .select("*")
            .eq("game_id", gameId);
        setPlayers(playerData);
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading game...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!game) return <div className="p-8 text-center text-gray-500">Game not found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={() => navigate('/games')}
            >
                ← Back to Games
            </button>
            <h1 className="text-2xl font-bold mb-4">Game: {game.name}</h1>
            <form onSubmit={handleJoinGame} className="mb-6 flex gap-2 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Join as player:</label>
                    <input
                        type="text"
                        value={joinName}
                        onChange={e => setJoinName(e.target.value)}
                        className="border px-3 py-2 rounded w-48"
                        placeholder="Your name"
                        disabled={joining}
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={joining}
                >
                    {joining ? "Joining..." : "Join Game"}
                </button>
                {joinError && <span className="text-red-600 ml-2 text-sm">{joinError}</span>}
            </form>


            {userId && players.some(p => p.name === userId || p.user_id === userId) && (

                <div>
                    <button
                        onClick={handleLeaveGame}
                        className="mb-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Leave Game
                    </button>
                </div>
            )}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">Players</h2>
                <ul className="grid grid-cols-2 gap-2">
                    {players.map(p => (
                        <li key={p.id} className="bg-gray-100 rounded px-3 py-2">
                            <span className="font-medium">{p.name}</span> <span className="text-xs text-gray-500">({p.type})</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-2">Board Locations</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="px-2 py-1 border">#</th>
                                <th className="px-2 py-1 border">Name</th>
                                <th className="px-2 py-1 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.map(loc => (
                                <tr key={loc.id}>
                                    <td className="border px-2 py-1 text-center">{loc.board_index}</td>
                                    <td className="border px-2 py-1">{loc.name}</td>
                                    <td className="border px-2 py-1">
                                        {(actions[loc.id] || []).map(a => (
                                            <span key={a.id} className="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 mr-1 mb-1 text-xs">{a.slug}</span>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}