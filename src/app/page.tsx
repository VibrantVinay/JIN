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
  Sun,
  Moon,
  History,
  FolderOpen,
  RotateCcw,
  Info,
  ExternalLink,
} from "lucide-react";

type Role = "user" | "admin";
type Tab =
  | "dashboard"
  | "discovery"
  | "classroom"
  | "assessments"
  | "coach"
  | "analytics"
  | "admin";
type ThemeMode = "light" | "zen";

interface User {
  username: string;
  role: Role;
  id: string;
}

export default function JinvexaLMSApp() {
  // Theme State: Light Mode default, Zen Mode optional
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  // Auth State (Functionality #14: Login / Exit)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Navigation & Active LLM (Functionality #12 & #13: Model Info & Change Model)
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [activeModel, setActiveModel] = useState("nvidia/nemotron-3-super");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Functionality #1 & #2: Goal-Based & Reference-Based Learning State
  const [discoveryType, setDiscoveryType] = useState<"goal" | "reference">("goal");
  const [goalInput, setGoalInput] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any[]>([]);

  // Functionality #3: Teaching Layer Classroom State
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);

  // Functionality #5 & #6: Mentoring Layer & History State
  const [mentorMode, setMentorMode] = useState<"session" | "full">("session");
  const [coachMessages, setCoachMessages] = useState([
    {
      sender: "coach",
      text: "Hello! I am your Jinvexa AI Mentor. I have full context of your active syllabus. How can I help you learn today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Functionality #4: Assignment Layer State
  const [activeQuizTopic, setActiveQuizTopic] = useState("Transformer Architectures & Attention");
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
  const [selectedMCQ, setSelectedMCQ] = useState<number | null>(null);
  const [essayText, setEssayText] = useState("");
  const [evalResult, setEvalResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Functionality #9, #10, & #11: View Sessions, Continue Conversation, & Teaching Status
  const [selectedSessionInspect, setSelectedSessionInspect] = useState<any | null>(null);

  // Mock Session Database
  const mockSessions = [
    {
      id: "sess_1_20260729_ai_dev",
      topic: "Generative AI & LLM Systems",
      mode: "Goal-Based",
      created: "2026-07-28 14:20",
      messages: 12,
      progress: "65%",
      lessonsGenerated: 12,
      audioFiles: 6,
      textFiles: 6,
      status: "Complete • Ready for Classroom",
    },
    {
      id: "sess_2_20260728_next_cloud",
      topic: "Next.js 14 Full-Stack Cloud",
      mode: "Reference-Based",
      created: "2026-07-27 09:15",
      messages: 8,
      progress: "90%",
      lessonsGenerated: 8,
      audioFiles: 4,
      textFiles: 4,
      status: "Complete • Ready for Classroom",
    },
  ];

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

  // Live Discovery API Call (Handles both Goal #1 & Reference #2)
  const handleAnalyzeDiscovery = async () => {
    const inputPayload = discoveryType === "goal" ? goalInput : referenceUrl;
    if (!inputPayload.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: inputPayload }),
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

  // Live Mentor Chat API Call (Functionality #5)
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
        body: JSON.stringify({
          messages: newMsgs,
          activeCourse: goalInput || "AI Engineering",
          mode: mentorMode,
        }),
      });
      const data = await res.json();
      setCoachMessages([...newMsgs, { sender: "coach", text: data.response }]);
    } catch (e) {
      setCoachMessages([
        ...newMsgs,
        {
          sender: "coach",
          text: "⚠️ Experienced a network delay. Please send your message once more.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Live Assignment Generator & Evaluator (Functionality #4)
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

  // Functionality #10: Continue Conversation Handler
  const handleContinueConversation = (sessionTopic: string) => {
    setGoalInput(sessionTopic);
    setActiveTab("discovery");
    handleAnalyzeDiscovery();
  };

  const syllabus = [
    {
      module: "Module 1: Foundations of Large Language Models",
      duration: "3 hours to complete",
      lessons: [
        {
          title: "The Scaling Gap in Traditional AI",
          type: "audio",
          voice: "Warm Female Audio",
          duration: "12m",
          reason: "Introductory conceptual overview requiring an engaging tone.",
        },
        {
          title: "Mathematical Foundations of Transformers",
          type: "text",
          voice: "Self-Paced Reading",
          duration: "25m",
          reason: "Formula-heavy content best suited for self-paced reading.",
        },
        {
          title: "Self-Attention vs. Multi-Head Attention",
          type: "audio",
          voice: "Professional Male Audio",
          duration: "18m",
          reason: "Technical architecture best delivered with an authoritative tone.",
        },
      ],
    },
    {
      module: "Module 2: Advanced Fine-Tuning & Quantization",
      duration: "4 hours to complete",
      lessons: [
        {
          title: "Low-Rank Adaptation (LoRA) Principles",
          type: "text",
          voice: "Self-Paced Reading",
          duration: "30m",
          reason: "Requires viewing side-by-side matrix rank code diagrams.",
        },
        {
          title: "RLHF: Reinforcement Learning from Human Feedback",
          type: "audio",
          voice: "Professional Male Audio",
          duration: "22m",
          reason: "High-level industry workflow standard.",
        },
      ],
    },
  ];

  // --- THEME UTILITY CLASSES ---
  const isZen = themeMode === "zen";
  const bgMain = isZen ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const bgCard = isZen
    ? "bg-slate-900/90 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";
  const bgInput = isZen
    ? "bg-slate-950 border-slate-800 text-white"
    : "bg-slate-50 border-slate-300 text-slate-900";

  // --- LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${bgMain} flex flex-col justify-center items-center p-4 font-sans`}>
        <div className={`w-full max-w-md ${bgCard} border rounded-2xl p-8 shadow-xl space-y-6`}>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-violet-600 rounded-xl shadow-md shadow-violet-600/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            {/* BRANDING: Jin in black/white, vexa in violet */}
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className={isZen ? "text-white" : "text-black"}>Jin</span>
              <span className="text-violet-600">vexa</span>
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Autonomous University & LMS Platform (14-in-1 Suite)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="alice or admin"
                className={`w-full ${bgInput} border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 transition`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full ${bgInput} border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 transition`}
              />
            </div>
            {authError && (
              <p className="text-xs text-rose-600 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 text-center font-medium">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg shadow transition text-sm flex items-center justify-center gap-2"
            >
              Enter Jinvexa University <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200/50 text-[11px] text-slate-500 text-center space-y-1">
            <p>Demo Learner: <span className="font-mono font-bold">alice / alice123</span></p>
            <p>Demo Admin: <span className="font-mono font-bold">admin / admin123</span></p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN 14-FUNCTIONALITY LMS LAYOUT ---
  return (
    <div className={`min-h-screen ${bgMain} flex flex-col font-sans transition-colors duration-300`}>
      {/* 1. LMS TOP NAVBAR */}
      <header
        className={`h-16 border-b ${
          isZen ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-white/95"
        } backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm`}
      >
        <div className="flex items-center gap-8">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="p-1.5 bg-violet-600 rounded-lg text-white font-bold shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            {/* BRANDING: Jin in black (white in zen), vexa in violet */}
            <span className="font-extrabold text-xl tracking-tight">
              <span className={isZen ? "text-white" : "text-black"}>Jin</span>
              <span className="text-violet-600">vexa</span>
            </span>
          </div>

          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "dashboard"
                  ? "text-violet-600 bg-violet-500/10 font-semibold"
                  : "text-slate-500 hover:text-violet-600"
              }`}
            >
              My Learning
            </button>
            <button
              onClick={() => setActiveTab("discovery")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "discovery"
                  ? "text-violet-600 bg-violet-500/10 font-semibold"
                  : "text-slate-500 hover:text-violet-600"
              }`}
            >
              Explore & Discover
            </button>
            <button
              onClick={() => setActiveTab("classroom")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "classroom"
                  ? "text-violet-600 bg-violet-500/10 font-semibold"
                  : "text-slate-500 hover:text-violet-600"
              }`}
            >
              Classroom
            </button>
            <button
              onClick={() => setActiveTab("assessments")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "assessments"
                  ? "text-violet-600 bg-violet-500/10 font-semibold"
                  : "text-slate-500 hover:text-violet-600"
              }`}
            >
              Graded Quizzes
            </button>
            <button
              onClick={() => setActiveTab("coach")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "coach"
                  ? "text-violet-600 bg-violet-500/10 font-semibold"
                  : "text-slate-500 hover:text-violet-600"
              }`}
            >
              AI Coach
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "analytics"
                  ? "text-violet-600 bg-violet-500/10 font-semibold"
                  : "text-slate-500 hover:text-violet-600"
              }`}
            >
              Analytics & Sessions
            </button>
            {currentUser.role === "admin" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "admin"
                    ? "text-purple-600 bg-purple-500/10 font-semibold"
                    : "text-slate-500 hover:text-purple-600"
                }`}
              >
                Admin Suite
              </button>
            )}
          </nav>
        </div>

        {/* Global Controls: Theme Switcher, Active Model Pill, & Logout */}
        <div className="flex items-center gap-3">
          {/* THEME SWITCHER: LIGHT ☀️ vs ZEN 🧘 */}
          <button
            onClick={() => setThemeMode(isZen ? "light" : "zen")}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition ${
              isZen
                ? "bg-slate-900 border-slate-700 text-amber-400"
                : "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
            }`}
            title="Toggle Theme Mode"
          >
            {isZen ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-600" />}
            <span>{isZen ? "Zen Mode" : "Light Mode"}</span>
          </button>

          {/* Functionality #12: Model Info Badge */}
          <div
            className={`hidden md:flex items-center gap-2 border rounded-full px-3 py-1 text-[11px] font-mono ${
              isZen ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-violet-600" />
            <span>{activeModel}</span>
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200/50">
            <div className="w-8 h-8 rounded-full bg-violet-100 border border-violet-300 flex items-center justify-center text-violet-700 font-bold text-xs">
              {currentUser.username.charAt(0)}
            </div>
            {/* Functionality #14: Exit / Logout */}
            <button
              onClick={() => setCurrentUser(null)}
              className="text-slate-400 hover:text-rose-600 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto">
        {/* TAB 1: MY LEARNING DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div
              className={`border rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm ${
                isZen
                  ? "bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 border-violet-500/30"
                  : "bg-gradient-to-r from-violet-100 via-purple-50 to-white border-violet-200"
              }`}
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-500/10 px-2.5 py-1 rounded border border-violet-500/20">
                  Autonomous Degree Track
                </span>
                <h1 className="text-3xl font-extrabold">Welcome back, {currentUser.username}</h1>
                <p className={`text-sm max-w-xl ${isZen ? "text-slate-300" : "text-slate-600"}`}>
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

            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" /> In Progress Specializations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockSessions.map((sess, idx) => (
                  <div
                    key={idx}
                    className={`${bgCard} border rounded-xl p-6 flex flex-col justify-between space-y-6 shadow-sm transition`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                        <span>{sess.mode} Course</span>
                        <span className="text-violet-600 font-bold bg-violet-500/10 px-2 py-0.5 rounded">
                          {sess.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold">{sess.topic}</h3>
                      <p className="text-xs text-slate-500">ID: {sess.id}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Overall Completion</span>
                        <span className="text-violet-600">{sess.progress}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full"
                          style={{ width: sess.progress }}
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">
                        Lessons: {sess.lessonsGenerated} • Audio: {sess.audioFiles}
                      </span>
                      <button
                        onClick={() => setActiveTab("classroom")}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        Resume Lecture <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPLORE SPECIALIZATIONS (Functionalities #1 & #2: Goal-Based & Reference-Based Discovery) */}
        {activeTab === "discovery" && (
          <div className="max-w-5xl mx-auto p-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-violet-600">
                Autonomous University Builder
              </span>
              <h1 className="text-3xl font-extrabold">How do you want to learn today?</h1>
              <p className="text-sm text-slate-500">
                Choose between entering a career goal or providing reference documentation.
              </p>

              {/* Mode Switcher: Goal #1 vs Reference #2 */}
              <div className="inline-flex p-1 bg-slate-200/60 dark:bg-slate-900 border rounded-xl gap-1 mt-4">
                <button
                  onClick={() => setDiscoveryType("goal")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    discoveryType === "goal"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-violet-600"
                  }`}
                >
                  🎯 1. Goal-Based Learning
                </button>
                <button
                  onClick={() => setDiscoveryType("reference")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    discoveryType === "reference"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-violet-600"
                  }`}
                >
                  📎 2. Reference-Based Learning
                </button>
              </div>
            </div>

            {/* Input Form Card */}
            <div className={`${bgCard} border rounded-2xl p-4 shadow-lg max-w-3xl mx-auto flex flex-col sm:flex-row gap-3`}>
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={discoveryType === "goal" ? goalInput : referenceUrl}
                  onChange={(e) =>
                    discoveryType === "goal"
                      ? setGoalInput(e.target.value)
                      : setReferenceUrl(e.target.value)
                  }
                  placeholder={
                    discoveryType === "goal"
                      ? "e.g., 'Master Artificial Intelligence and LLM Systems'"
                      : "Paste URL, YouTube link, or document path (e.g., 'https://arxiv.org/abs/...')"
                  }
                  className={`w-full ${bgInput} border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-violet-600 transition`}
                />
              </div>
              <button
                onClick={handleAnalyzeDiscovery}
                disabled={isAnalyzing}
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isAnalyzing ? "Analyzing & Building..." : "Generate Specialization"}
              </button>
            </div>

            {/* Generated Specialization Curriculum */}
            {generatedRoadmap.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-slate-200/50 animate-in fade-in">
                <div className={`${bgCard} border rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm`}>
                  <div>
                    <span className="text-xs text-violet-600 font-bold uppercase tracking-wider">
                      Professional Specialization ({discoveryType.toUpperCase()})
                    </span>
                    <h2 className="text-2xl font-bold mt-1">
                      {goalInput || referenceUrl || "AI Engineering Track"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Complete all modules to unlock your Degree Certificate.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("classroom")}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition shadow flex items-center gap-2"
                  >
                    Enroll & Open Classroom <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Syllabus Modules
                  </h3>
                  <div className="grid gap-4">
                    {generatedRoadmap.map((item, idx) => (
                      <div
                        key={idx}
                        className={`${bgCard} border rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-600 font-bold text-xs">
                              {item.phase}
                            </span>
                            <h4 className="font-bold text-base">{item.title}</h4>
                          </div>
                          <p className="text-xs text-slate-500 pl-9">{item.description}</p>
                          <div className="flex flex-wrap gap-2 pl-9 pt-1">
                            {item.topics?.map((tp: string, i: number) => (
                              <span
                                key={i}
                                className="text-[11px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium px-2.5 py-0.5 rounded"
                              >
                                {tp}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-200/50 w-full md:w-auto justify-between md:justify-end">
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

        {/* TAB 3: TEACHING LAYER CLASSROOM (Functionality #3) */}
        {activeTab === "classroom" && (
          <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            <aside
              className={`w-80 border-r ${
                isZen ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
              } flex flex-col transition-all ${sidebarOpen ? "block" : "hidden"}`}
            >
              <div className="p-4 border-b border-slate-200/50 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Course Syllabus
                  </h3>
                  <p className="text-sm font-bold truncate w-56">
                    {goalInput || "AI Systems Engineering"}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {syllabus.map((mod, modIdx) => (
                  <div key={modIdx} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{mod.module}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{mod.duration}</p>

                    <div className="space-y-1 pt-1">
                      {mod.lessons.map((les, lesIdx) => {
                        const isCurrent = activeModule === modIdx && activeLesson === lesIdx;
                        return (
                          <div
                            key={lesIdx}
                            onClick={() => {
                              setActiveModule(modIdx);
                              setActiveLesson(lesIdx);
                            }}
                            className={`p-3 rounded-xl cursor-pointer transition flex items-start gap-3 border ${
                              isCurrent
                                ? "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-500 text-violet-700 dark:text-violet-300 font-semibold shadow-sm"
                                : "bg-transparent border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <div className="mt-0.5">
                              {les.type === "audio" ? (
                                <Volume2
                                  className={`w-4 h-4 ${
                                    isCurrent ? "text-violet-600" : "text-slate-400"
                                  }`}
                                />
                              ) : (
                                <FileText
                                  className={`w-4 h-4 ${
                                    isCurrent ? "text-violet-600" : "text-slate-400"
                                  }`}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate">{les.title}</p>
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
            <div className={`flex-1 flex flex-col ${bgMain} overflow-y-auto`}>
              <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Course 2</span> <ChevronRight className="w-3.5 h-3.5" />
                  <span>{syllabus[activeModule].module}</span>{" "}
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-violet-600 font-semibold">
                    {syllabus[activeModule].lessons[activeLesson].title}
                  </span>
                </div>

                <div className={`${bgCard} border rounded-2xl p-6 shadow-sm space-y-6`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-medium bg-violet-500/10 text-violet-600 border border-violet-500/20 px-2.5 py-1 rounded">
                          {syllabus[activeModule].lessons[activeLesson].voice}
                        </span>
                        <span className="text-[11px] text-slate-500 italic">
                          "{syllabus[activeModule].lessons[activeLesson].reason}"
                        </span>
                      </div>
                      <h1 className="text-2xl font-extrabold mt-2">
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

                  <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <button className="w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow transition flex-shrink-0">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>AI Lecture Narration ({activeModel})</span>
                        <span className="text-slate-500 font-mono">
                          03:45 / {syllabus[activeModule].lessons[activeLesson].duration}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                        <div className="w-1/3 h-full bg-violet-600 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${bgCard} border rounded-2xl p-8 space-y-6 shadow-sm`}>
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-600" /> Lesson Transcript & Notes
                  </h3>
                  <div className="prose max-w-none text-sm space-y-4 leading-relaxed font-normal">
                    <p>
                      In traditional software engineering, algorithms are explicitly programmed using
                      deterministic conditional logic. However, as problem domains scale in
                      complexity—such as natural language translation or vision recognition—the
                      human ability to hand-code rules collapses.
                    </p>
                    <div className="p-4 bg-slate-100 dark:bg-slate-950 border-l-4 border-violet-600 rounded-r-xl text-xs font-mono font-medium">
                      Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V
                    </div>
                    <p>
                      This equation represents the scaled dot-product attention. By computing the
                      dot product between query (Q) and key (K) matrices, the model dynamically
                      assigns importance weights to every token in the context window regardless of
                      positional distance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ASSIGNMENTS LAYER (Functionality #4) */}
        {activeTab === "assessments" && (
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div className="border-b border-slate-200/50 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  4. Assignment Layer
                </span>
                <h1 className="text-2xl font-bold mt-2">
                  Module 1 Quiz: Transformer Architectures
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Submit your responses to receive an immediate AI pedagogical evaluation and
                  grade breakdown.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-medium border px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                  <Clock className="w-4 h-4 text-violet-600" /> Time Limit: 30 mins
                </span>
              </div>
            </div>

            {!assignmentData ? (
              <div className={`${bgCard} border rounded-2xl p-12 text-center space-y-4 shadow-sm`}>
                <Award className="w-12 h-12 text-violet-600 mx-auto" />
                <h3 className="text-lg font-bold">Ready to take the assessment?</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                  This quiz consists of multiple-choice analytical questions and an open-ended
                  essay prompt evaluated autonomously.
                </p>
                <button
                  onClick={handleGenerateAssignment}
                  disabled={isLoadingAssignment}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3 rounded-xl transition text-sm inline-flex items-center gap-2 shadow-md"
                >
                  {isLoadingAssignment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isLoadingAssignment ? "Compiling Quiz..." : "Start Graded Quiz"}
                </button>
              </div>
            ) : !evalResult ? (
              <div className={`${bgCard} border rounded-2xl p-8 space-y-8 shadow-md`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                      Question 1 • Multiple Choice
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-medium">10 Points</span>
                  </div>
                  <p className="text-base font-semibold">{assignmentData.mcq?.question}</p>
                  <div className="space-y-2.5 pt-2">
                    {assignmentData.mcq?.options?.map((opt: string, idx: number) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer text-sm transition font-medium ${
                          selectedMCQ === idx
                            ? "bg-violet-500/10 border-violet-500 font-semibold shadow-sm"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300"
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

                <div className="space-y-4 pt-6 border-t border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                      Question 2 • Open Response
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-medium">20 Points</span>
                  </div>
                  <p className="text-base font-semibold">{assignmentData.essay?.question}</p>
                  <textarea
                    rows={5}
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    placeholder="Provide a detailed, structured technical explanation..."
                    className={`w-full ${bgInput} border rounded-xl p-4 text-sm placeholder-slate-400 outline-none focus:border-violet-600 transition`}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={isEvaluating || selectedMCQ === null || !essayText.trim()}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition text-sm flex items-center gap-2 shadow-md"
                  >
                    {isEvaluating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isEvaluating ? "AI Grading in Progress..." : "Submit Assessment"}
                  </button>
                </div>
              </div>
            ) : (
              <div className={`${bgCard} border rounded-2xl p-8 space-y-6 shadow-md animate-in zoom-in-95`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-600">
                      <Award className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                        Assessment Passed
                      </span>
                      <h3 className="text-2xl font-extrabold mt-0.5">
                        Grade: {evalResult.grade} ({evalResult.score}%)
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setAssignmentData(null)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    Retake Quiz
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pedagogical Feedback
                  </h4>
                  <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl text-sm leading-relaxed font-normal">
                    {evalResult.feedback}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AI COACH & HISTORY (Functionalities #5 & #6: Mentoring Layer & History) */}
        {activeTab === "coach" && (
          <div className="max-w-4xl mx-auto p-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className={`${bgCard} border rounded-2xl flex-1 flex flex-col overflow-hidden shadow-lg`}>
              <div className="p-4 border-b border-slate-200/50 bg-slate-100 dark:bg-slate-950 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-600 font-bold">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">5. Jinvexa AI Learning Coach</h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Mode: <span className="text-violet-600 font-bold">{mentorMode.toUpperCase()}</span> • Context trained on your active syllabus
                    </p>
                  </div>
                </div>

                {/* Mode Toggle (#5) & Mentoring History Button (#6) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMentorMode(mentorMode === "session" ? "full" : "session")}
                    className="px-3 py-1 text-xs font-bold rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-violet-500 transition"
                  >
                    {mentorMode === "session" ? "1. Session Mode" : "2. Full Mode"}
                  </button>
                  <button
                    onClick={() => setShowHistoryModal(!showHistoryModal)}
                    className="px-3 py-1 text-xs font-bold rounded-lg border bg-violet-500/10 border-violet-500/30 text-violet-600 hover:bg-violet-500/20 flex items-center gap-1 transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>6. History</span>
                  </button>
                </div>
              </div>

              {/* Mentoring History Drawer (Functionality #6) */}
              {showHistoryModal && (
                <div className="p-4 bg-violet-50 dark:bg-slate-900 border-b border-violet-200 dark:border-slate-800 space-y-2 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-violet-600 uppercase">
                      6. Saved Mentoring Conversations
                    </span>
                    <button
                      onClick={() => setShowHistoryModal(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { topic: "Transformer Math Explanations", date: "2026-07-28", msgs: 8 },
                      { topic: "LoRA vs Full Fine-Tuning", date: "2026-07-27", msgs: 14 },
                    ].map((hist, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold truncate">{hist.topic}</p>
                          <p className="text-[10px] text-slate-500">{hist.date} • {hist.msgs} msgs</p>
                        </div>
                        <button
                          onClick={() => {
                            setCoachMessages([
                              ...coachMessages,
                              { sender: "coach", text: `Resuming conversation on '${hist.topic}'. Where left off?` },
                            ]);
                            setShowHistoryModal(false);
                          }}
                          className="px-2 py-1 bg-violet-600 text-white rounded font-medium"
                        >
                          Resume
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {coachMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed font-medium ${
                        msg.sender === "user"
                          ? "bg-violet-600 text-white rounded-br-none shadow-sm"
                          : "bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 pl-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> AI Coach is reasoning...
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200/50 bg-slate-100 dark:bg-slate-950 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask for lecture summaries, code debugging, or math explanations..."
                  className={`flex-1 ${bgInput} border rounded-xl px-4 py-3 text-xs placeholder-slate-400 outline-none focus:border-violet-600 shadow-sm transition`}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-5 rounded-xl transition flex items-center justify-center shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ANALYTICS, SESSIONS, PROGRESS, & TEACHING STATUS (#7, #8, #9, #10, & #11) */}
        {activeTab === "analytics" && (
          <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-violet-600" /> 7. & 8. Analytics & Progress Metrics
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time tracking of your mastered concepts, assignments, and certificate eligibility.
              </p>
            </div>

            {/* Functionality #7 & #8: View Progress & Stats Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className={`${bgCard} border p-5 rounded-2xl space-y-1 shadow-sm`}>
                <p className="text-xs text-slate-500 uppercase font-semibold">Total Sessions</p>
                <p className="text-3xl font-extrabold text-violet-600">14</p>
              </div>
              <div className={`${bgCard} border p-5 rounded-2xl space-y-1 shadow-sm`}>
                <p className="text-xs text-slate-500 uppercase font-semibold">Mastered Concepts</p>
                <p className="text-3xl font-extrabold text-purple-600">42</p>
              </div>
              <div className={`${bgCard} border p-5 rounded-2xl space-y-1 shadow-sm`}>
                <p className="text-xs text-slate-500 uppercase font-semibold">Average Quiz Score</p>
                <p className="text-3xl font-extrabold text-emerald-600">88%</p>
              </div>
              <div className={`${bgCard} border p-5 rounded-2xl space-y-1 shadow-sm`}>
                <p className="text-xs text-slate-500 uppercase font-semibold">7. Certificate Status</p>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-4 h-4" /> Eligible for Track
                </p>
              </div>
            </div>

            {/* Functionality #9: View Sessions Table */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-600" /> 9. All User Sessions
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {mockSessions.map((sess, idx) => (
                  <div
                    key={idx}
                    className={`${bgCard} border rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-violet-600">
                        <span>{sess.mode}</span> • <span>Created: {sess.created}</span>
                      </div>
                      <h3 className="text-lg font-bold">{sess.topic}</h3>
                      <p className="text-xs text-slate-500 font-mono">ID: {sess.id}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Functionality #11: Teaching Status Modal Trigger */}
                      <button
                        onClick={() => setSelectedSessionInspect(sess)}
                        className="px-3 py-2 border rounded-lg text-xs font-bold hover:border-violet-500 flex items-center gap-1.5 transition"
                      >
                        <Info className="w-3.5 h-3.5 text-violet-600" />
                        <span>11. Teaching Status</span>
                      </button>

                      {/* Functionality #10: Continue Conversation Trigger */}
                      <button
                        onClick={() => handleContinueConversation(sess.topic)}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <span>10. Continue Conversation</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Functionality #11: Teaching Status Inspector Modal */}
            {selectedSessionInspect && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className={`${bgCard} border max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-2xl`}>
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-base">11. Teaching Status Inspector</h3>
                    <button
                      onClick={() => setSelectedSessionInspect(null)}
                      className="text-xs text-slate-400 hover:text-rose-500 font-bold"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p>
                      <strong>Session ID:</strong> <span className="font-mono">{selectedSessionInspect.id}</span>
                    </p>
                    <p>
                      <strong>Topic:</strong> {selectedSessionInspect.topic}
                    </p>
                    <p>
                      <strong>Generated Manifest:</strong> Complete • 4 Phases
                    </p>
                    <p>
                      <strong>Text Lesson Files:</strong> {selectedSessionInspect.textFiles} files ready
                    </p>
                    <p>
                      <strong>TTS Audio Files:</strong> {selectedSessionInspect.audioFiles} files ready
                    </p>
                    <p>
                      <strong>Overall Status:</strong>{" "}
                      <span className="text-emerald-600 font-bold">{selectedSessionInspect.status}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: ADMIN SUITE (Functionality #12 & #13: Model Info & Change Model) */}
        {activeTab === "admin" && currentUser.role === "admin" && (
          <div className="max-w-5xl mx-auto p-8 space-y-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-600" /> Enterprise Admin Suite
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                12. Model Info & 13. Active Cloud Reasoning Engine Switcher.
              </p>
            </div>

            <div className={`${bgCard} border rounded-2xl p-6 space-y-4 shadow-sm`}>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                13. Active Cloud Reasoning Engine
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "meta/llama-3.3-70b-instruct",
                    name: "Llama 3.3 70B Instruct",
                    desc: "NVIDIA NIM Free Endpoint • Fast & Reliable",
                  },
                  {
                    id: "nvidia/nemotron-3-super",
                    name: "NVIDIA Nemotron 3 Super",
                    desc: "NVIDIA NIM Free Endpoint • Flagship Reasoning",
                  },
                  {
                    id: "z-ai/glm-5.2",
                    name: "GLM 5.2 Agentic LLM",
                    desc: "NVIDIA NIM Free Endpoint • Coding & Agentic Tasks",
                  },
                  {
                    id: "google/gemma-4-31b-it:free",
                    name: "Google Gemma 4 31B Cloud",
                    desc: "OpenRouter Backup Endpoint",
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModel(m.id)}
                    className={`p-4 rounded-xl border text-left transition flex justify-between items-center ${
                      activeModel === m.id
                        ? "bg-violet-500/10 border-violet-500 font-semibold shadow-sm"
                        : "bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-400"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{m.name}</p>
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
