export function Board({ locations, players, actions, currentPlayer }) {
    return (
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
    );
}
