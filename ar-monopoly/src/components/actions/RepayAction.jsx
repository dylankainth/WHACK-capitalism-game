import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function RepayActionModal({ game, player, onComplete, onClose }) {
    const [debts, setDebts] = useState([]);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [repayAmount, setRepayAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchDebts() {
            setLoading(true);
            const { data, error } = await supabase
                .from('debts')
                .select('*')
                .eq('game_id', game.id)
                .eq('debtee_id', player.id)
                .eq('status', 'ACTIVE');

            if (error) {
                setError(error.message);
            } else {
                setDebts(data);
            }
            setLoading(false);
        }
        fetchDebts();
    }, [game.id, player.id]);

    async function handleRepay() {
        if (!selectedDebt || repayAmount <= 0) return;

        setLoading(true);
        setError(null);
        try {
            const remaining = selectedDebt.principal_current - repayAmount;
            const newStatus = remaining <= 0 ? 'PAID' : 'ACTIVE';

            // 1. Update the debt
            const { error: debtError } = await supabase
                .from('debts')
                .update({ principal_current: Math.max(0, remaining), status: newStatus })
                .eq('id', selectedDebt.id);
            if (debtError) throw debtError;

            // 2. Create a transaction for the repayment
            const { error: txError } = await supabase.from('transactions').insert({
                game_id: game.id,
                payment: repayAmount,
                sender_id: player.id,
                receiver_id: selectedDebt.loaner_id,
                descr: `Repaid $${repayAmount} of debt.`,
                base_from_score: repayAmount * 0.001, // Positive impact for repaying
            });
            if (txError) throw txError;

            onComplete(`Repaid $${repayAmount}.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">Loading debts...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Repay Debt</h3>
                {debts.length === 0 ? (
                    <p>You have no active debts to repay.</p>
                ) : (
                    <>
                        <div className="mb-4 space-y-2">
                            {debts.map(debt => (
                                <div key={debt.id}
                                    className={`p-3 border rounded-md cursor-pointer ${selectedDebt?.id === debt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                    onClick={() => {
                                        setSelectedDebt(debt);
                                        setRepayAmount(debt.principal_current);
                                    }}>
                                    <p><strong>Amount:</strong> ${debt.principal_current}</p>
                                    <p className="text-sm text-gray-500">From Turn: {debt.start_turn}, Interest: {debt.interest_rate * 100}%</p>
                                </div>
                            ))}
                        </div>
                        {selectedDebt && (
                            <div className="mb-4">
                                <label htmlFor="repay-amount" className="block text-sm font-medium text-gray-700">Repay Amount</label>
                                <input
                                    type="number"
                                    id="repay-amount"
                                    value={repayAmount}
                                    onChange={(e) => setRepayAmount(Math.min(selectedDebt.principal_current, Math.max(0, parseInt(e.target.value, 10))))}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    max={selectedDebt.principal_current}
                                />
                            </div>
                        )}
                    </>
                )}
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                    <button onClick={handleRepay} disabled={loading || !selectedDebt || repayAmount <= 0} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Repaying...' : 'Confirm Repayment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
