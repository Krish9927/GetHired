import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { TEST_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "./shared/Navbar";

const TakeTest = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const startTime = useRef(Date.now());
    const timerRef = useRef(null);

    useEffect(() => {
        fetchTest();
        return () => clearInterval(timerRef.current);
    }, []);

    const fetchTest = async () => {
        try {
            const res = await axios.get(`${TEST_API_END_POINT}/${testId}/take`, { withCredentials: true });
            if (res.data.success) {
                setTest(res.data.test);
                setAnswers(new Array(res.data.test.questions.length).fill(-1));
                const seconds = res.data.test.durationMinutes * 60;
                setTimeLeft(seconds);
                startTimer(seconds);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load test");
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    const startTimer = (seconds) => {
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const handleAnswer = (optionIndex) => {
        const updated = [...answers];
        updated[currentQ] = optionIndex;
        setAnswers(updated);
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit) {
            const unanswered = answers.filter((a) => a === -1).length;
            if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
        }
        clearInterval(timerRef.current);
        setSubmitting(true);
        try {
            const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
            const res = await axios.post(`${TEST_API_END_POINT}/${testId}/submit`, { answers, timeTakenSeconds: timeTaken }, { withCredentials: true });
            if (res.data.success) setResult(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#6A38C2]" />
        </div>
    );

    // Result screen
    if (result) return (
        <div className="min-h-screen dark:bg-gray-950 bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
                <div className="text-5xl">{result.qualified ? "🎉" : "📊"}</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{result.qualified ? "You Qualified!" : "Test Completed"}</h2>
                <div className={`text-5xl font-bold ${result.qualified ? "text-green-500" : "text-red-500"}`}>{result.score}%</div>
                <p className="text-gray-500">{result.correctCount} / {result.totalQuestions} correct · Min required: {result.minimumScore}%</p>
                {result.qualified
                    ? <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-green-700 dark:text-green-300 text-sm">✅ Congratulations! A result email has been sent. The recruiter will review your performance.</div>
                    : <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">You did not meet the minimum score. Keep practicing and try again!</div>
                }
                <Button onClick={() => navigate("/")} className="w-full bg-[#6A38C2] hover:bg-[#5b30a6] mt-2">Back to Home</Button>
            </div>
        </div>
    );

    if (!test) return null;
    const q = test.questions[currentQ];
    const answered = answers.filter((a) => a !== -1).length;
    const urgent = timeLeft < 120;

    return (
        <div className="min-h-screen dark:bg-gray-950 bg-gray-50">
            <Navbar />
            {/* Timer bar */}
            <div className={`sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b ${urgent ? "bg-red-50 dark:bg-red-900/20 border-red-200" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}>
                <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">{test.title}</p>
                    <p className="text-xs text-gray-400">{answered}/{test.questions.length} answered · Min score: {test.minimumScore}%</p>
                </div>
                <div className={`flex items-center gap-2 font-bold text-lg ${urgent ? "text-red-600" : "text-[#6A38C2]"}`}>
                    <Clock className="w-5 h-5" />
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {/* Question dots */}
                <div className="flex flex-wrap gap-2">
                    {test.questions.map((_, i) => (
                        <button key={i} onClick={() => setCurrentQ(i)}
                            className={`w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${i === currentQ ? "bg-[#6A38C2] text-white border-[#6A38C2]" : answers[i] !== -1 ? "bg-green-100 text-green-700 border-green-400" : "bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700"}`}>
                            {i + 1}
                        </button>
                    ))}
                </div>

                {/* Question card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Badge className="bg-[#6A38C2]/10 text-[#6A38C2] text-xs">Q{currentQ + 1} of {test.questions.length}</Badge>
                    </div>
                    <p className="text-base font-medium text-gray-900 dark:text-white leading-relaxed">{q.text}</p>
                    <div className="space-y-2">
                        {q.options.map((opt, i) => (
                            <button key={i} onClick={() => handleAnswer(i)}
                                className={`w-full text-left p-4 rounded-xl border-2 text-sm transition-all ${answers[currentQ] === i ? "border-[#6A38C2] bg-[#6A38C2]/10 text-[#6A38C2] dark:text-purple-300 font-medium" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300"}`}>
                                <span className="font-semibold mr-2">{["A", "B", "C", "D"][i]}.</span>{opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Nav */}
                <div className="flex items-center justify-between">
                    <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ((p) => p - 1)} className="gap-1">
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    {currentQ < test.questions.length - 1 ? (
                        <Button onClick={() => setCurrentQ((p) => p + 1)} className="bg-[#6A38C2] gap-1">
                            Next <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button onClick={() => handleSubmit(false)} disabled={submitting} className="bg-green-600 hover:bg-green-700 gap-1">
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4" /> Submit Test</>}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TakeTest;
