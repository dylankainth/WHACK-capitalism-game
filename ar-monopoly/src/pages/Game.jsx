import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { BorrowActionModal } from "../components/actions/BorrowAction";
import { RepayActionModal } from "../components/actions/RepayAction";
import { GenericActionModal } from "../components/actions/GenericAction";
import ARViewer from "../components/ARViewer";

// --- Helper Components ---

function ActionResolver({ action, game, player, onComplete, onClose }) {
    if (!action) return null;

    switch (action.slug) {
        case 'borrow':
            return <BorrowActionModal game={game} player={player} onComplete={onComplete} onClose={onClose} />;
        case 'repay':
            return <RepayActionModal game={game} player={player} onComplete={onComplete} onClose={onClose} />;
        case 'buy_food':
        case 'buy_computer':
            return <GenericActionModal game={game} player={player} action={action} onComplete={onComplete} onClose={onClose} />;
        case 'do_nothing':
            // Immediately complete the action since there's no UI
            onComplete("Did nothing.");
            return null;
        default:
            // Fallback for actions without a custom modal
            return <GenericActionModal game={game} player={player} action={action} onComplete={onComplete} onClose={onClose} />;
    }
}

function LocationActionModal({ location, actions, onAction, onClose }) {
    if (!location) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">
                    Actions at: <span className="text-blue-600">{location.name}</span>
                </h3>
                <p className="mb-6 text-gray-600">You have landed on board position {location.board_index}. Choose an action.</p>
                <div className="space-y-3">
                    {(actions[location.id] || []).map(action => (
                        <button
                            key={action.id}
                            onClick={() => onAction(action)}
                            className="w-full text-left bg-gray-100 hover:bg-blue-100 border border-gray-200 px-4 py-3 rounded-md transition-colors"
                        >
                            <p className="font-semibold text-gray-800">{action.slug.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-500">{action.descr}</p>
                        </button>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                >
                    Close
                </button>
            </div>
        </div>
    );
}


function PlayerStats({ player, money, score }) {
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

// --- Main Game Page Component ---

export default function GamePage() {
    const { gameId } = useParams();
    const navigate = useNavigate();

    // Base game data
    const [game, setGame] = useState(null);
    const [players, setPlayers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [actions, setActions] = useState({}); // { locationId: [action, ...] }
    const [userId, setUserId] = useState(null);

    // Live game state
    const [playerDetails, setPlayerDetails] = useState({}); // { playerId: { money, score } }
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [gameLog, setGameLog] = useState([]);
    const [activeModalLocation, setActiveModalLocation] = useState(null);
    const [activeAction, setActiveAction] = useState(null);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);
    const [joinName, setJoinName] = useState("");
    const [activeTab, setActiveTab] = useState('game'); // 'game' or 'ar'


    const log = useCallback((message) => {
        console.log(message);
        setGameLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    }, []);

    const fetchAllGameData = useCallback(async () => {
        console.log("Fetching all game data...");
        setLoading(true);
        setError(null);
        try {
            // Step 1: Fetch primary data (game, players, locations)
            const { data: gameData, error: gameError } = await supabase.from("games").select("*").eq("id", gameId).single();
            if (gameError) throw gameError;
            setGame(gameData);

            const { data: playerData, error: playerError } = await supabase.from("players").select("*").eq("game_id", gameId).order('id');
            if (playerError) throw playerError;
            setPlayers(playerData);

            const { data: locationData, error: locationError } = await supabase.from("locations").select("*").eq("game_id", gameId).order("board_index");
            if (locationError) throw locationError;
            setLocations(locationData);

            // Step 2: Fetch actions using the location IDs from Step 1
            const locationIds = locationData.map(l => l.id);
            const { data: locActsData, error: locActsError } = await supabase
                .from("location_actions")
                .select("location_id,actions:action_id(*)")
                .in('location_id', locationIds);
            if (locActsError) throw locActsError;

            const actsMap = {};
            for (const la of locActsData) {
                if (!actsMap[la.location_id]) actsMap[la.location_id] = [];
                actsMap[la.location_id].push(la.actions);
            }
            setActions(actsMap);

            // Set current player (simple turn logic)
            if (playerData.length > 0) {
                const totalTurns = playerData.reduce((sum, p) => sum + p.turns, 0);
                const humanPlayers = playerData.filter(p => p.type === 'HUMAN');
                if (humanPlayers.length > 0) {
                    setCurrentPlayer(humanPlayers[totalTurns % humanPlayers.length]);
                }
            }

            log("Game data loaded successfully.");

        } catch (err) {
            setError(err.message || "Failed to load game data");
            log(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [gameId, log]);

    const fetchPlayerVitals = useCallback(async () => {
        console.log("Fetching player vitals (money and score)...");
        try {
            const [
                { data: moneyData, error: moneyError },
                { data: scoreData, error: scoreError }
            ] = await Promise.all([
                supabase.from('v_player_money').select('*').eq('game_id', gameId),
                supabase.from('v_player_score').select('*').eq('game_id', gameId)
            ]);

            if (moneyError) throw moneyError;
            if (scoreError) throw scoreError;

            const details = {};
            for (const p of players) {
                details[p.id] = {
                    money: moneyData.find(m => m.player_id === p.id)?.money,
                    score: scoreData.find(s => s.player_id === p.id)?.score,
                };
            }
            setPlayerDetails(details);
            log("Player money and scores updated.");

        } catch (err) {
            setError(err.message || "Failed to fetch player details");
            log(`Error: ${err.message}`);
        }
    }, [gameId, players, log]);


    useEffect(() => {
        fetchAllGameData();
    }, [fetchAllGameData]);

    // Realtime subscriptions: keep UI in sync with DB changes
    useEffect(() => {
        if (!gameId) return;
        // Supabase Realtime v2 channel API
        const chan = supabase.channel(`public:game-${gameId}`);

        // Helper to handle row changes and refresh local pieces
        const handleChange = async (payload) => {
            const { table } = payload;
            // For simplicity, re-fetch the relevant data sets depending on table
            try {
                if (table === 'games') {
                    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
                    if (!error && data) setGame(data);
                } else if (table === 'players') {
                    const { data, error } = await supabase.from('players').select('*').eq('game_id', gameId).order('id');
                    if (!error) setPlayers(data || []);
                } else if (table === 'locations') {
                    const { data, error } = await supabase.from('locations').select('*').eq('game_id', gameId).order('board_index');
                    if (!error) setLocations(data || []);
                } else if (table === 'location_actions' || table === 'actions') {
                    // Re-fetch actions map
                    const locationIds = locations.map(l => l.id);
                    if (locationIds.length > 0) {
                        const { data: locActsData, error: locActsError } = await supabase
                            .from('location_actions')
                            .select('location_id,actions:action_id(*)')
                            .in('location_id', locationIds);
                        if (!locActsError) {
                            const actsMap = {};
                            for (const la of locActsData) {
                                if (!actsMap[la.location_id]) actsMap[la.location_id] = [];
                                actsMap[la.location_id].push(la.actions);
                            }
                            setActions(actsMap);
                        }
                    }
                }
            } catch (err) {
                console.warn('Realtime handler error', err);
            }
        };

        // Listen for changes on the public schema tables relevant to this game
        chan.on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) => handleChange({ ...payload, table: 'games' }));
        chan.on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, (payload) => handleChange({ ...payload, table: 'players' }));
        chan.on('postgres_changes', { event: '*', schema: 'public', table: 'locations', filter: `game_id=eq.${gameId}` }, (payload) => handleChange({ ...payload, table: 'locations' }));
        chan.on('postgres_changes', { event: '*', schema: 'public', table: 'location_actions' }, (payload) => handleChange({ ...payload, table: 'location_actions' }));

        // Subscribe the channel
        chan.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Realtime channel subscribed for game', gameId);
            }
        });

        return () => {
            try {
                chan.unsubscribe();
            } catch (e) {
                console.warn('Failed to unsubscribe realtime channel', e);
            }
        };
    }, [gameId, locations]);

    useEffect(() => {
        if (players.length > 0) {
            fetchPlayerVitals();
        }
    }, [players, fetchPlayerVitals]);


    useEffect(() => {
        async function fetchUser() {
            const { data, error } = await supabase.auth.getUser();
            if (error) console.error("Failed to get user:", error);
            setUserId(data?.user?.id || null);
        }
        fetchUser();
    }, []);

    // --- Game Logic Handlers ---

    const handleRollAndMove = async () => {
        if (!currentPlayer) return;

        const roll = Math.floor(Math.random() * 6) + 1;
        log(`${currentPlayer.name} rolled a ${roll}.`);

        const newPosition = (currentPlayer.location_idx + roll) % game.board_size;

        const { error } = await supabase
            .from('players')
            .update({ location_idx: newPosition })
            .eq('id', currentPlayer.id);

        if (error) {
            log(`Error moving player: ${error.message}`);
            setError(error.message);
            return;
        }

        const newLocation = locations.find(l => l.board_index === newPosition);
        log(`${currentPlayer.name} moved to ${newLocation.name} (Pos: ${newPosition}).`);

        // Update local player state and open action modal
        const updatedPlayer = { ...currentPlayer, location_idx: newPosition };
        setCurrentPlayer(updatedPlayer);
        setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
        setActiveModalLocation(newLocation);
    };

    const handlePlayerAction = async (action) => {
        log(`Player chose action: ${action.slug}`);
        setActiveModalLocation(null); // Close location modal
        setActiveAction(action); // Open the specific action modal
    };

    const onActionComplete = async (message) => {
        log(message);
        setActiveAction(null); // Close action modal
        // Refresh player vitals to show updated money/score
        await fetchPlayerVitals();
    };

    const handleEndTurn = async () => {
        if (!currentPlayer) return;

        log(`Ending turn for ${currentPlayer.name}.`);
        const { error } = await supabase
            .from('players')
            .update({ turns: currentPlayer.turns + 1 })
            .eq('id', currentPlayer.id);

        if (error) {
            log(`Error ending turn: ${error.message}`);
            setError(error.message);
            return;
        }

        // Refresh all data to get next turn's state
        await fetchAllGameData();
        await fetchPlayerVitals();
    };


    // --- Original Join/Leave Handlers (Adapted) ---

    async function handleJoinGame(e) {
        e.preventDefault();
        setJoining(true);
        setJoinError(null);
        try {
            if (!joinName.trim()) throw new Error("Please enter your name.");

            const { data: existing, error: existErr } = await supabase
                .from("players").select("id").eq("game_id", gameId).eq("name", joinName.trim()).maybeSingle();
            if (existErr) throw existErr;
            if (existing) throw new Error("A player with that name already exists.");

            const { error: insertErr } = await supabase
                .from("players")
                .insert({ game_id: gameId, name: joinName.trim(), type: "HUMAN", user_id: userId || null, location_idx: 0 });
            if (insertErr) throw insertErr;

            setJoinName("");
            log(`Player ${joinName.trim()} joined the game!`);
            await fetchAllGameData(); // Refresh everything

        } catch (err) {
            setJoinError(err.message);
        } finally {
            setJoining(false);
        }
    }

    async function handleLeaveGame() {
        if (!userId) return;
        const myPlayer = players.find(p => p.user_id === userId);
        if (!myPlayer) return;

        const { error } = await supabase.from("players").delete().eq("id", myPlayer.id);
        if (error) {
            alert("Failed to leave game: " + error.message);
            return;
        }
        log(`Player ${myPlayer.name} has left the game.`);
        await fetchAllGameData();
    }

    // --- Render Logic ---

    if (loading && !game) return <div className="p-8 text-center text-gray-500">Loading game...</div>;
    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>;
    if (!game) return <div className="p-8 text-center text-gray-500">Game not found.</div>;

    const me = players.find(p => p.user_id === userId);
    const isMyTurn = me && currentPlayer && me.id === currentPlayer.id;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <LocationActionModal
                location={activeModalLocation}
                actions={actions}
                onAction={handlePlayerAction}
                onClose={() => setActiveModalLocation(null)}
            />

            <ActionResolver
                action={activeAction}
                game={game}
                player={currentPlayer}
                onComplete={onActionComplete}
                onClose={() => setActiveAction(null)}
            />

            {/* Tab Navigation */}
            <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('game')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'game'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Game Board
                    </button>
                    <button
                        onClick={() => setActiveTab('ar')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'ar'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        AR View
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'game' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white">
                        {/* Left Column: Game Info & Controls */}
                        <div className="lg:col-span-1 space-y-6">
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

                            {/* Join Form */}
                            {!me && (
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
                            )}

                            {/* Game Controls */}
                            {me && (
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
                            )}

                            {/* Game Log */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h2 className="text-lg font-semibold mb-2">Game Log</h2>
                                <div className="h-64 overflow-y-auto bg-gray-50 p-2 rounded-md text-xs font-mono space-y-1">
                                    {gameLog.map((msg, i) => <p key={i}>{msg}</p>)}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Players & Board */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Players List */}
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

                            {/* Board */}
                            <div>
                                <h2 className="text-xl font-semibold mb-3">Board Locations</h2>
                                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                                    <table className="min-w-full border-collapse text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-3 py-2 border-b text-left">#</th>
                                                <th className="px-3 py-2 border-b text-left">Name</th>
                                                <th className="px-3 py-2 border-b text-left">Players Here</th>
                                                <th className="px-3 py-2 border-b text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {locations.map(loc => (
                                                <tr key={loc.id} className="hover:bg-gray-50">
                                                    <td className="border-b px-3 py-2 text-center font-bold">{loc.board_index}</td>
                                                    <td className="border-b px-3 py-2">{loc.name}</td>
                                                    <td className="border-b px-3 py-2">
                                                        {players.filter(p => p.location_idx === loc.board_index).map(p => (
                                                            <span key={p.id} className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold mr-1 ${p.id === currentPlayer?.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                                                {p.name}
                                                            </span>
                                                        ))}
                                                    </td>
                                                    <td className="border-b px-3 py-2">
                                                        {(actions[loc.id] || []).map(a => (
                                                            <span key={a.id} title={a.descr} className="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 mr-1 mb-1 text-xs cursor-help">{a.slug}</span>
                                                        ))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'ar' && (
                    <ARViewer />
                )}
            </div>
        </div>
    );
}