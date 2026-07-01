import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { TEST_API_END_POINT } from "@/utils/constant";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ArrowLeft, Trophy, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const TestResults = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await axios.get(`${TEST_API_END_POINT}/${testId}/results`, { withCredentials: true });
            if (res.data.success) setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#6A38C2]" />
        </div>
    );

    if (!data) return null;

    const { test, submissions } = data;
    const qualified = submissions.filter((s) => s.qualified).length;

    return (
        <div className="min-h-screen flex flex-col dark:bg-gray-950 bg-gray-50">
            <Navbar />

            <div className="bg-gradient-to-r from-[#6A38C2] to-[#4f28a0] py-8 px-6">
                <div className="max-w-5xl mx-auto flex items-center gap-3">
                    <button onClick={() => navigate("/admin/jobs")} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">{test.title} — Results</h1>
                        <p className="text-purple-200 text-sm">{submissions.length} submissions · {qualified} qualified · Min score: {test.minimumScore}%</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 flex-1 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Submitted", value: submissions.length, color: "text-blue-600" },
                        { label: "Qualified", value: qualified, color: "text-green-600" },
                        { label: "Avg Score", value: submissions.length ? Math.round(submissions.reduce((a, s) => a + s.score, 0) / submissions.length) + "%" : "N/A", color: "text-purple-600" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Leaderboard */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Leaderboard</h2>
                    </div>
                    {submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Trophy className="w-10 h-10 opacity-20 mb-3" />
                            <p>No submissions yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {submissions.map((sub, i) => (
                                <div key={sub._id} className="flex items-center gap-4 px-6 py-4">
                                    {/* Rank */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-600" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}>
                                        {sub.rank || i + 1}
                                    </div>
                                    {/* Avatar */}
                                    <Avatar className="w-9 h-9 shrink-0">
                                        <AvatarImage src={sub.candidate?.profile?.profilePhoto} />
                                        <AvatarFallback className="text-xs">{sub.candidate?.fullname?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{sub.candidate?.fullname}</p>
                                        <p className="text-xs text-gray-400 truncate">{sub.candidate?.email}</p>
                                    </div>
                                    {/* Score */}
                                    <div className="text-right shrink-0">
                                        <p className={`font-bold text-lg ${sub.qualified ? "text-green-600" : "text-red-500"}`}>{sub.score}%</p>
                                        <p className="text-xs text-gray-400">{sub.correctCount}/{sub.totalQuestions} correct</p>
                                    </div>
                                    {/* Status */}
                                    {sub.qualified
                                        ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                        : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TestResults;
