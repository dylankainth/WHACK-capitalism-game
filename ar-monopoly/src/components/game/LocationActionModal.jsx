export function LocationActionModal({ location, actions, onAction, onClose }) {
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
