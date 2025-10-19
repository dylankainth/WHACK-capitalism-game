import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    async function handleCreateAnon() {
        try {
            setLoading(true);
            setError(null);

            // Sign in with anonymous user in supabase
            const { data, error: authError } = await supabase.auth.signInAnonymously();

            if (authError) {
                console.error("Supabase signInAnonymously error:", authError);
                setError("Could not create anonymous account: " + authError.message);
                return;
            }

            if (data?.user) {
                console.log("Anonymous user created:", data.user.id);
                // Redirect to games page on successful login
                navigate("/games");
            }

        } catch (err) {
            console.error("Unexpected error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-2xl bg-white rounded-sm shadow-sm border border-gray-200 p-12 text-center">
                <h1 className="text-3xl font-medium text-gray-800 mb-6">
                    Learn about credit - with our AR game
                </h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCreateAnon}
                    disabled={loading}
                    className="inline-block bg-blue-600 text-white font-medium px-8 py-3 rounded-sm hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    aria-label="Access AR Module"
                >
                    {loading ? "Creating account…" : "Create an account and play"}
                </button>
            </div>
        </div>
    );
}