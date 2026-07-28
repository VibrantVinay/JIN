"use client";

import React, { useState } from "react";
import {
  Brain,
  Search,
  BookOpen,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  LogOut,
  Cpu,
  Sparkles,
  Play,
  FileText,
  Volume2,
  Award,
  Send,
  Lock,
  UserCheck,
  ChevronRight,
  Layers,
  ArrowRight,
  Clock,
  Zap,
  Loader2,
  GraduationCap,
  Check,
  AlertCircle,
} from "lucide-react";

type Role = "user" | "admin";
type Tab = "dashboard" | "discovery" | "classroom" | "assessments" | "coach" | "admin";

interface User {
  username: string;
  role: Role;
  id: string;
}

export default function JinvexaCourseraUI() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [activeModel, setActiveModel] = useState("meta/llama-3.3-70b-instruct");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Discovery State
  const [goalInput, setGoalInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any[]>([]);

  // Classroom State
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);

  // AI Coach State
  const [coachMessages, setCoachMessages] = useState([
    {
      sender: "coach",
      text: "Hello! I am your Jinvexa AI Learning Coach powered by llama-3.3-70b-instruct. How can I assist with your coursework today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Quiz State
  const [activeQuizTopic, setActiveQuizTopic] = useState("Transformer Architectures & Attention");
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
  const [selectedMCQ, setSelectedMCQ] = useState<number | null>(null);
  const [essayText, setEssayText] = useState("");
  const [evalResult, setEvalResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === "admin" && loginPassword === "admin123") {
      setCurrentUser({ username: "Admin Console", role: "admin", id: "1" });
      setAuthError("");
    } else if (loginUsername === "alice" && loginPassword === "alice123") {
      setCurrentUser({ username: "Alice Smith", role: "user", id: "2" });
      setAuthError("");
    } else if (loginUsername && loginPassword) {
      setCurrentUser({ username: loginUsername, role: "user", id: "3" });
      setAuthError("");
    } else {
      setAuthError("Please enter valid credentials (e.g., alice / alice123)");
    }
  };

  const handleAnalyzeGoal = async () => {
    if (!goalInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalInput }),
      });
      const data = await res.json();
      if (data.roadmap) {
        setGeneratedRoadmap(data.roadmap);
      }
    } catch (e) {
      console.error("Discovery Error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isThinking) return;
    const newMsgs = [...coachMessages, { sender: "user", text: chatInput }];
    setCoachMessages(newMsgs);
    setChatInput("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, activeCourse: goalInput || "AI Engineering" }),
      });
      const data = await res.json();
      setCoachMessages([...newMsgs, { sender: "coach", text: data.response }]);
    } catch (e) {
      setCoachMessages([...newMsgs, { sender: "coach", text: "⚠️ Experienced a network delay. Please send your message once more." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateAssignment = async () => {
    setIsLoadingAssignment(true);
    setEvalResult(null);
    try {
      const res = await fetch("/api/assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", topic: activeQuizTopic }),
      });
      const data = await res.json();
      setAssignmentData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAssignment(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (selectedMCQ === null || !essayText.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          topic: activeQuizTopic,
          userAnswers: { mcq: selectedMCQ, essay: essayText },
        }),
      });
      const data = await res.json();
      setEvalResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const syllabus = [
    {
      module: "Module 1: Foundations of Large Language Models",
      duration: "3 hours to complete",
      lessons: [
        { title: "The Scaling Gap in Traditional AI", type: "audio", voice: "Warm Female Audio", duration: "12m" },
        { title: "Mathematical Foundations of Transformers", type: "text", voice: "Self-Paced Reading", duration: "25m" },
        { title: "Self-Attention vs. Multi-Head Attention", type: "audio", voice: "Professional Male Audio", duration: "18m" },
      ],
    },
    {
      module: "Module 2: Advanced Fine-Tuning & Quantization",
      duration: "4 hours to complete",
      lessons: [
        { title: "Low-Rank Adaptation (LoRA) Principles", type: "text", voice: "Self-Paced Reading", duration: "30m" },
        { title: "RLHF: Reinforcement Learning from Human Feedback", type: "audio", voice: "Professional Male Audio", duration: "22m" },
      ],
    },
  ];

  // --- LIGHT MODE LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-violet-600 rounded-xl shadow-md shadow-violet-600/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            {/* JINVEXA BRANDING: JIN IN BLACK, VEXA IN VIOLET */}
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-black">Jin</span><span className="text-violet-600">vexa</span>
            </h1>
            <p className="text-xs font-medium text-slate-500">Autonomous AI Learning & Degree Platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Email or Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="alice or admin"
                className="w-full bg-slate-50 border border-slate-300 focus:border-violet-600 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 focus:border-violet-600 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
              />
            </div>
            {authError && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-center font-medium">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg shadow transition text-sm flex items-center justify-center gap-2"
            >
              Continue to My Learning <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center space-y-1">
            <p>Demo Learner: <span className="text-slate-800 font-mono font-medium">alice / alice123</span></p>
            <p>Demo Administrator: <span className="text-slate-800 font-mono font-medium">admin / admin123</span></p>
          </div>
        </div>
      </div>
    );
  }

  // --- LIGHT MODE MAIN LMS LAYOUT ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. TOP NAVBAR */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setActiveTab("dashboard")}>
            <div className="p-1.5 bg-violet-600 rounded-lg text-white font-bold shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            {/* JINVEXA BRANDING: JIN IN BLACK, VEXA IN VIOLET */}
            <span className="font-extrabold text-xl tracking-tight">
              <span className="text-black">Jin</span><span className="text-violet-600">vexa</span>
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === "dashboard" ? "text-violet-700 bg-violet-50 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"}`}
            >
              My Learning
            </button>
            <button
              onClick={() => setActiveTab("discovery")}
              className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === "discovery" ? "text-violet-700 bg-violet-50 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"}`}
            >
              Explore Specializations
            </button>
            <button
              onClick={() => setActiveTab("classroom")}
              className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === "classroom" ? "text-violet-700 bg-violet-50 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"}`}
            >
              Classroom
            </button>
            <button
              onClick={() => setActiveTab("assessments")}
              className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === "assessments" ? "text-violet-700 bg-violet-50 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"}`}
            >
              Graded Quizzes
            </button>
            <button
              onClick={() => setActiveTab("coach")}
              className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === "coach" ? "text-violet-700 bg-violet-50 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"}`}
            >
              AI Coach
            </button>
            {currentUser.role === "admin" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === "admin" ? "text-purple-700 bg-purple-50 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"}`}
              >
                Admin Suite
              </button>
            )}
          </nav>
        </div>

        {/* Global Search & User Profile */}
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses, skills, videos..."
              className="w-full bg-slate-100 border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-500 outline-none focus:border-violet-600 focus:bg-white transition"
            />
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-[11px] text-slate-700 font-mono font-medium">
            <Cpu className="w-3.5 h-3.5 text-violet-600" />
            <span>{activeModel}</span>
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-violet-100 border border-violet-300 flex items-center justify-center text-violet-700 font-bold text-xs">
              {currentUser.username.charAt(0)}
            </div>
            <button onClick={() => setCurrentUser(null)} className="text-slate-400 hover:text-rose-600 transition" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. VIEWPORT CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {/* TAB 1: MY LEARNING DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div className="bg-gradient-to-r from-violet-100 via-purple-50 to-white border border-violet-200 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-200/60 px-2.5 py-1 rounded border border-violet-300">
                  Professional Degree Track
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900">Welcome back, {currentUser.username}</h1>
                <p className="text-sm text-slate-600 max-w-xl">
                  You are making steady progress! You have completed 4 lessons this week. Keep up the momentum to complete your specialized certification.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("discovery")}
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition text-sm flex items-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" /> Build New AI Curriculum
              </button>
            </div>

            {/* Active Courses Grid */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" /> In Progress Courses
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-300 shadow-sm transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                      <span>Course 2 of 4 in Specialization</span>
                      <span className="text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded border border-violet-200">In Progress</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Generative AI & LLM Systems Engineering</h3>
                    <p className="text-xs text-slate-500">Autonomous University Track</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Overall Completion</span>
                      <span className="text-violet-700">65%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[65%] h-full bg-violet-600 rounded-full" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">Next: Math Foundations</span>
                    <button
                      onClick={() => setActiveTab("classroom")}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                    >
                      Resume Lecture <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-300 shadow-sm transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                      <span>Course 1 of 3 in Specialization</span>
                      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Assessment Due</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Full-Stack Next.js 14 & Cloud Architecture</h3>
                    <p className="text-xs text-slate-500">Jinvexa Developer Network</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Overall Completion</span>
                      <span className="text-amber-600">90%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[90%] h-full bg-amber-500 rounded-full" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Next: Graded Quiz • 30 mins</span>
                    <button
                      onClick={() => setActiveTab("assessments")}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                    >
                      Go to Quiz <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPLORE SPECIALIZATIONS (GOAL DISCOVERY) */}
        {activeTab === "discovery" && (
          <div className="max-w-5xl mx-auto p-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-violet-600">Autonomous Degree Builder</span>
              <h1 className="text-3xl font-extrabold text-slate-900">What topic or career specialization do you want to master?</h1>
              <p className="text-sm text-slate-600">
                Enter any career goal or technical subject. Our AI will dynamically construct a multi-phase syllabus with custom audio lectures and graded rubrics.
              </p>
            </div>

            {/* Search Studio Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g., 'Master Artificial Intelligence and LLM Systems'"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-600 focus:bg-white transition"
                />
              </div>
              <button
                onClick={handleAnalyzeGoal}
                disabled={isAnalyzing}
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isAnalyzing ? "Designing Curriculum..." : "Generate Specialization"}
              </button>
            </div>

            {/* Generated Specialization Curriculum */}
            {generatedRoadmap.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-slate-200 animate-in fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <span className="text-xs text-violet-700 font-bold uppercase tracking-wider">Professional Specialization</span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-1">{goalInput || "AI Engineering"}</h2>
                    <p className="text-xs text-slate-500 mt-1">4-Course Series • Earn a sharable Career Certificate upon completion</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("classroom")}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition shadow flex items-center gap-2"
                  >
                    Enroll in Specialization <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Courses in this Specialization</h3>
                  <div className="grid gap-4">
                    {generatedRoadmap.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-violet-100 border border-violet-300 flex items-center justify-center text-violet-700 font-bold text-xs">
                              {item.phase}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base">{item.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 pl-9">{item.description}</p>
                          <div className="flex flex-wrap gap-2 pl-9 pt-1">
                            {item.topics?.map((tp: string, i: number) => (
                              <span key={i} className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 font-medium px-2.5 py-0.5 rounded">
                                {tp}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 w-full md:w-auto justify-between md:justify-end">
                          <span className="text-xs text-slate-500 font-mono flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" /> {item.hours} hrs
                          </span>
                          <button
                            onClick={() => setActiveTab("classroom")}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                          >
                            View Syllabus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLASSROOM PLAYER */}
        {activeTab === "classroom" && (
          <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* Left Syllabus Sidebar */}
            <aside className={`w-80 border-r border-slate-200 bg-white flex flex-col transition-all ${sidebarOpen ? "block" : "hidden"}`}>
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Course Syllabus</h3>
                  <p className="text-sm font-bold text-slate-900 truncate w-56">{goalInput || "AI Systems Engineering"}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {syllabus.map((mod, modIdx) => (
                  <div key={modIdx} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{mod.module}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{mod.duration}</p>

                    <div className="space-y-1 pt-1">
                      {mod.lessons.map((les, lesIdx) => {
                        const isCurrent = activeModule === modIdx && activeLesson === lesIdx;
                        return (
                          <div
                            key={lesIdx}
                            onClick={() => { setActiveModule(modIdx); setActiveLesson(lesIdx); }}
                            className={`p-3 rounded-xl cursor-pointer transition flex items-start gap-3 border ${
                              isCurrent
                                ? "bg-violet-50 border-violet-300 text-violet-900 shadow-sm"
                                : "bg-white border-transparent hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <div className="mt-0.5">
                              {les.type === "audio" ? <Volume2 className={`w-4 h-4 ${isCurrent ? "text-violet-600" : "text-slate-400"}`} /> : <FileText className={`w-4 h-4 ${isCurrent ? "text-violet-600" : "text-slate-400"}`} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{les.title}</p>
                              <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-medium">
                                <span>{les.voice}</span>
                                <span>{les.duration}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Main Lecture Viewport */}
            <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
              <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Course 2</span> <ChevronRight className="w-3.5 h-3.5" />
                  <span>{syllabus[activeModule].module}</span> <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-violet-700 font-semibold">{syllabus[activeModule].lessons[activeLesson].title}</span>
                </div>

                {/* Video / Audio Player Header */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[11px] font-mono font-medium bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded">
                        {syllabus[activeModule].lessons[activeLesson].voice}
                      </span>
                      <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
                        {syllabus[activeModule].lessons[activeLesson].title}
                      </h1>
                    </div>
                    <button
                      onClick={() => setActiveTab("assessments")}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      Next: Graded Quiz <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Audio Controls */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                    <button className="w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow transition flex-shrink-0">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs text-slate-700 font-semibold">
                        <span>AI Lecture Narration ({activeModel})</span>
                        <span className="text-slate-500 font-mono">03:45 / {syllabus[activeModule].lessons[activeLesson].duration}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden cursor-pointer">
                        <div className="w-1/3 h-full bg-violet-600 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lecture Transcript */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-600" /> Lesson Transcript & Notes
                  </h3>
                  <div className="prose max-w-none text-sm text-slate-700 space-y-4 leading-relaxed font-normal">
                    <p>
                      In traditional software engineering, algorithms are explicitly programmed using deterministic conditional logic. However, as problem domains scale in complexity—such as natural language translation or vision recognition—the human ability to hand-code rules collapses.
                    </p>
                    <div className="p-4 bg-slate-50 border-l-4 border-violet-600 rounded-r-xl text-xs text-slate-800 font-mono font-medium">
                      Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V
                    </div>
                    <p>
                      This equation represents the scaled dot-product attention. By computing the dot product between query (Q) and key (K) matrices, the model dynamically assigns importance weights to every token in the context window regardless of positional distance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GRADED ASSIGNMENTS */}
        {activeTab === "assessments" && (
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                  Graded Assessment
                </span>
                <h1 className="text-2xl font-bold text-slate-900 mt-2">Module 1 Quiz: Transformer Architectures</h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">Submit your responses to receive an immediate AI pedagogical evaluation and grade breakdown.</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-medium bg-white text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                  <Clock className="w-4 h-4 text-violet-600" /> Time Limit: 30 mins
                </span>
              </div>
            </div>

            {!assignmentData ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                <Award className="w-12 h-12 text-violet-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Ready to take the assessment?</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                  This quiz consists of multiple-choice analytical questions and an open-ended essay prompt evaluated autonomously.
                </p>
                <button
                  onClick={handleGenerateAssignment}
                  disabled={isLoadingAssignment}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3 rounded-xl transition text-sm inline-flex items-center gap-2 shadow-md"
                >
                  {isLoadingAssignment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isLoadingAssignment ? "Compiling Quiz..." : "Start Graded Quiz"}
                </button>
              </div>
            ) : !evalResult ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-8 shadow-md">
                {/* MCQ */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Question 1 • Multiple Choice</span>
                    <span className="text-xs text-slate-500 font-mono font-medium">10 Points</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{assignmentData.mcq?.question}</p>
                  <div className="space-y-2.5 pt-2">
                    {assignmentData.mcq?.options?.map((opt: string, idx: number) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer text-sm transition font-medium ${
                          selectedMCQ === idx ? "bg-violet-50 border-violet-500 text-violet-950 font-semibold shadow-sm" : "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mcq"
                          checked={selectedMCQ === idx}
                          onChange={() => setSelectedMCQ(idx)}
                          className="w-4 h-4 text-violet-600 bg-white border-slate-300 focus:ring-0"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Essay */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Question 2 • Open Response</span>
                    <span className="text-xs text-slate-500 font-mono font-medium">20 Points</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{assignmentData.essay?.question}</p>
                  <textarea
                    rows={5}
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    placeholder="Provide a detailed, structured technical explanation..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-600 focus:bg-white transition"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={isEvaluating || selectedMCQ === null || !essayText.trim()}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition text-sm flex items-center gap-2 shadow-md"
                  >
                    {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isEvaluating ? "AI Grading in Progress..." : "Submit Assessment"}
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz Results */
              <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-md animate-in zoom-in-95">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-full text-emerald-700">
                      <Award className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Assessment Passed</span>
                      <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">Grade: {evalResult.grade} ({evalResult.score}%)</h3>
                    </div>
                  </div>
                  <button onClick={() => setAssignmentData(null)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm">
                    Retake Quiz
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pedagogical Feedback</h4>
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-sm text-slate-800 leading-relaxed font-normal">
                    {evalResult.feedback}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AI COACH */}
        {activeTab === "coach" && (
          <div className="max-w-4xl mx-auto p-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="bg-white border border-slate-200 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 border border-violet-200 rounded-lg text-violet-700 font-bold">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Jinvexa AI Learning Coach</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Trained on your active syllabus & degree curriculum</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded">
                  Live Engine
                </span>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {coachMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed font-medium ${msg.sender === "user" ? "bg-violet-600 text-white rounded-br-none shadow-sm" : "bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 pl-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> AI Coach is reviewing your coursework...
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask for lecture summaries, code debugging, or math explanations..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-violet-600 shadow-sm transition"
                />
                <button onClick={handleSendMessage} className="bg-violet-600 hover:bg-violet-700 text-white px-5 rounded-xl transition flex items-center justify-center shadow-sm">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ADMIN SUITE */}
        {activeTab === "admin" && currentUser.role === "admin" && (
          <div className="max-w-5xl mx-auto p-8 space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-violet-600" /> Enterprise Admin Suite
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">Manage cloud reasoning models, database shards, and user enrollments.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Cloud Reasoning Engine</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", desc: "NVIDIA NIM Free Endpoint • Fast & Reliable" },
                  { id: "nvidia/nemotron-3-super", name: "NVIDIA Nemotron 3 Super", desc: "NVIDIA NIM Free Endpoint • Flagship Reasoning" },
                  { id: "z-ai/glm-5.2", name: "GLM 5.2 Agentic LLM", desc: "NVIDIA NIM Free Endpoint • Coding & Agentic Tasks" },
                  { id: "google/gemma-4-31b-it:free", name: "Google Gemma 4 31B Cloud", desc: "OpenRouter Backup Endpoint" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModel(m.id)}
                    className={`p-4 rounded-xl border text-left transition flex justify-between items-center ${
                      activeModel === m.id ? "bg-violet-50 border-violet-500 text-violet-900 font-semibold shadow-sm" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 font-medium"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{m.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-normal">{m.desc}</p>
                    </div>
                    {activeModel === m.id && <CheckCircle2 className="w-4 h-4 text-violet-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
