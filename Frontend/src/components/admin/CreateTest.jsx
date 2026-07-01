import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import axios from "axios";
import { TEST_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, ClipboardList } from "lucide-react";

const CreateTest = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [topics, setTopics] = useState([]);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState("");

    const [form, setForm] = useState({
        title: searchParams.get("title") || "",
        description: searchParams.get("description") || "",
        durationMinutes: searchParams.get("durationMinutes") || 30,
        minimumScore: searchParams.get("minimumScore") || 60,
        scheduledAt: searchParams.get("scheduledAt") || "",
        autoSelectCount: 5,
        selectedTopics: [],
        customQuestionIds: [],
        // Custom question builder
        customQuestion: { text: "", options: ["", "", "", ""], correctIndex: 0 },
        addedCustomQuestions: [],
    });

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const res = await axios.get(`${TEST_API_END_POINT}/topics`);
            if (res.data.success) setTopics(res.data.topics);
        } catch (err) { console.error(err); }
    };

    const fetchQuestionsByTopic = async (topic) => {
        try {
            const res = await axios.get(`${TEST_API_END_POINT}/questions?topic=${topic}&difficulty=medium&limit=10`, { withCredentials: true });
            if (res.data.success) setBankQuestions(res.data.questions);
        } catch (err) { console.error(err); }
    };

    const toggleTopic = (topic) => {
        setForm((f) => ({
            ...f,
            selectedTopics: f.selectedTopics.includes(topic)
                ? f.selectedTopics.filter((t) => t !== topic)
                : [...f.selectedTopics, topic],
        }));
    };

    const toggleBankQuestion = (id) => {
        setForm((f) => ({
            ...f,
            customQuestionIds: f.customQuestionIds.includes(id)
                ? f.customQuestionIds.filter((q) => q !== id)
                : [...f.customQuestionIds, id],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title) return toast.error("Test title is required");
        if (form.selectedTopics.length === 0 && form.customQuestionIds.length === 0) {
            return toast.error("Add topics for auto-select or pick questions manually");
        }
        setLoading(true);
        try {
            const res = await axios.post(`${TEST_API_END_POINT}/create`, {
                jobId,
                title: form.title,
                description: form.description,
                durationMinutes: Number(form.durationMinutes),
                minimumScore: Number(form.minimumScore),
                scheduledAt: form.scheduledAt || null,
                topics: form.selectedTopics,
                autoSelectCount: form.selectedTopics.length > 0 ? Number(form.autoSelectCount) : 0,
                customQuestionIds: form.customQuestionIds,
            }, { withCredentials: true });

            if (res.data.success) {
                toast.success("Test created successfully!");
                navigate(`/admin/jobs`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create test");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col dark:bg-gray-950 bg-gray-50">
            <Navbar />
            <div className="bg-gradient-to-r from-[#6A38C2] to-[#4f28a0] py-8 px-6">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <button onClick={() => navigate("/admin/jobs")} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-white" />
                        <h1 className="text-xl font-bold text-white">Create Candidate Test</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 flex-1 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic info */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Test Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Test Title *</Label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Frontend Developer Assessment" className="h-10" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Description</Label>
                                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the test" className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Duration (minutes)</Label>
                                <Input type="number" min={5} max={180} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Minimum Score to Qualify (%)</Label>
                                <Input type="number" min={0} max={100} value={form.minimumScore} onChange={(e) => setForm({ ...form, minimumScore: e.target.value })} className="h-10" />
                            </div>
                        </div>
                    </div>

                    {/* Topic-based auto-select */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Auto-Select Questions by Topic</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Select topics and we'll auto-pick medium difficulty questions</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {topics.map((topic) => (
                                <button key={topic} type="button" onClick={() => toggleTopic(topic)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.selectedTopics.includes(topic) ? "bg-[#6A38C2] text-white border-[#6A38C2]" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#6A38C2]"}`}>
                                    {topic}
                                </button>
                            ))}
                        </div>
                        {form.selectedTopics.length > 0 && (
                            <div className="space-y-1.5">
                                <Label>Number of questions to auto-select</Label>
                                <Input type="number" min={1} max={20} value={form.autoSelectCount} onChange={(e) => setForm({ ...form, autoSelectCount: e.target.value })} className="h-10 max-w-xs" />
                            </div>
                        )}
                    </div>

                    {/* Manual question selection from bank */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Pick Questions Manually (Optional)</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Browse the question bank and add specific questions</p>
                        </div>
                        <div className="flex gap-2">
                            <select value={selectedTopic} onChange={(e) => { setSelectedTopic(e.target.value); fetchQuestionsByTopic(e.target.value); }}
                                className="flex-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                                <option value="">Select a topic to browse</option>
                                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        {bankQuestions.length > 0 && (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {bankQuestions.map((q) => (
                                    <div key={q._id} onClick={() => toggleBankQuestion(q._id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all text-sm ${form.customQuestionIds.includes(q._id) ? "border-[#6A38C2] bg-[#6A38C2]/5" : "border-gray-100 dark:border-gray-800 hover:border-gray-300"}`}>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{q.text}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {q.options.map((opt, i) => (
                                                <span key={i} className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">{opt}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {form.customQuestionIds.length > 0 && (
                            <p className="text-xs text-[#6A38C2] font-medium">{form.customQuestionIds.length} question(s) selected from bank</p>
                        )}
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] font-semibold text-white rounded-xl">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating Test...</> : "Create Test"}
                    </Button>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default CreateTest;
