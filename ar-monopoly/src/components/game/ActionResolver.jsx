import { BorrowActionModal } from "../actions/BorrowAction";
import { RepayActionModal } from "../actions/RepayAction";
import { GenericActionModal } from "../actions/GenericAction";

export function ActionResolver({ action, game, player, onComplete, onClose }) {
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
