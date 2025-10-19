import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function BorrowActionModal({ game, player, onComplete, onClose }) {
    const [amount, setAmount] = useState(100);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleBorrow() {
        setLoading(true);
        setError(null);
        try {
            const { data: bank, error: bankError } = await supabase
                .from('players')
                .select('id')
                .eq('game_id', game.id)
                .eq('type', 'BANK')
                .single();

            if (bankError) throw new Error("Bank not found for this game.");

            // 1. Create a new debt
            const { error: debtError } = await supabase.from('debts').insert({
                game_id: game.id,
                debtee_id: player.id,
                loaner_id: bank.id,
                start_turn: player.turns,
                principal_current: amount,
                interest_rate: 0.05, // As per python server
                status: 'ACTIVE',
            });
            if (debtError) throw debtError;

            // 2. Create a transaction for the loan
            const { error: txError } = await supabase.from('transactions').insert({
                game_id: game.id,
                payment: amount,
                sender_id: bank.id,
                receiver_id: player.id,
                descr: `Borrowed $${amount} from the bank.`,
                base_to_score: Math.round(-1 * (amount * 0.001)), // Negative impact for borrowing
            });
            if (txError) throw txError;

            onComplete(`Borrowed $${amount}.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">Borrow from Bank</h3>
                <p className="mb-4 text-gray-600">Select an amount to borrow. This will create a debt with interest.</p>
                <div className="mb-4">
                    <label htmlFor="borrow-amount" className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                        type="number"
                        id="borrow-amount"
                        value={amount}
                        onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10)))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        step="50"
                    />
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50">Cancel</button>
                    <button onClick={handleBorrow} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Borrowing...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}
