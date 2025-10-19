import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function GenericActionModal({ game, player, action, onComplete, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const actionCosts = {
        'buy_food': 50,
        'buy_computer': 200,
    };

    const cost = actionCosts[action.slug] || 0;

    async function handleAction() {
        setLoading(true);
        setError(null);
        try {
            const { data: npc, error: npcError } = await supabase
                .from('players')
                .select('id')
                .eq('game_id', game.id)
                .ilike('name', `%${action.slug.split('_')[1]}%`) // e.g., 'food' -> 'Super Market'
                .single();

            if (npcError) throw new Error(`Could not find the required vendor for this action.`);

            // Create a transaction for the purchase
            const { error: txError } = await supabase.from('transactions').insert({
                game_id: game.id,
                payment: cost,
                sender_id: player.id,
                receiver_id: npc.id,
                descr: action.descr,
                base_from_score: cost * 0.001, // Small score boost for spending
            });
            if (txError) throw txError;

            onComplete(`Completed: ${action.descr}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-2">{action.descr}</h3>
                <p className="mb-4 text-gray-600">This action costs ${cost}.</p>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50">Cancel</button>
                    <button onClick={handleAction} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}
