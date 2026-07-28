"use client";

import React, { useState } from "react";
import {
  Brain,
  Compass,
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
  Database,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Zap,
} from "lucide-react";

// --- TYPES ---
type Role = "user" | "admin";
type Tab =
  | "discovery"
  | "reference"
  | "teaching"
  | "assignments"
  | "mentoring"
  | "stats"
  | "admin";

interface User {
  username: string;
  role: Role;
  id: string;
}

export default function JinvexaApp() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Navigation
  const [activeTab, setActiveTab] = useState<Tab>("discovery");

  // App State Data
  const [goalInput, setGoalInput] = useState("");
  const [discoveryStep, setDiscoveryStep] = useState(0);
  const [activeModel, setActiveModel] = useState("gemma4:31b-cloud");
  const [mentorMessages, setMentorMessages] = useState([
    {
      sender: "mentor",
      text: "Hello! I am your Jinvexa AI Mentor. What topic shall we master today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

  // Mock Authentication Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === "admin" && loginPassword === "admin123") {
      setCurrentUser({ username: "admin", role: "admin", id: "1" });
      setAuthError("");
    } else if (loginUsername === "alice" && loginPassword === "alice123") {
      setCurrentUser({ username: "alice", role: "user", id: "2" });
      setAuthError("");
    } else if (loginUsername && loginPassword) {
      // Default demo login
      setCurrentUser({ username: loginUsername, role: "user", id: "3" });
      setAuthError("");
    } else {
      setAuthError("Invalid credentials. Try admin/admin123 or alice/alice123");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUsername("");
    setLoginPassword("");
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMentorMessages((prev) => [
      ...prev,
      { sender: "user", text: chatInput },
      {
        sender: "mentor",
        text: `That is a fantastic question regarding ${chatInput}. In Jinvexa's architecture, we break down this concept into structured knowledge graphs to ensure zero learning gaps!`,
      },
    ]);
    setChatInput("");
  };

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Futuristic Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg mb-3">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              JINVEXA AI
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              "Tell me what you want to become. I'll build your university."
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin or alice"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition"
                />
                <UserCheck className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition"
                />
                <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
              </div>
            </div>

            {authError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-center">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 text-sm"
            >
              Sign In to Platform <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-xs text-slate-500 text-center space-y-1">
            <p>Demo Admin: <span className="text-slate-300 font-mono">admin / admin123</span></p>
            <p>Demo Student: <span className="text-slate-300 font-mono">alice / alice123</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              JINVEXA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 ml-2 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              v2.0 Autonomous
            </span>
          </div>
        </div>

        {/* Model Status & User Info */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-full px-3 py-1 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Model: <strong className="text-indigo-400">{activeModel}</strong></span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{currentUser.username}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{currentUser.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3">
                Discovery & Plan
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("discovery")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === "discovery"
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <Compass className="w-4 h-4" /> Goal-Based Learning
                </button>
                <button
                  onClick={() => setActiveTab("reference")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === "reference"
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <Layers className="w-4 h-4" /> Reference Material
                </button>
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3">
                Creation & Execution
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("teaching")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === "teaching"
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Teaching Layer
                </button>
                <button
                  onClick={() => setActiveTab("assignments")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === "assignments"
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Assignments & Evaluation
                </button>
                <button
                  onClick={() => setActiveTab("mentoring")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === "mentoring"
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> AI Mentor Chat
                </button>
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3">
                Analytics & System
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === "stats"
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> Progress & Metrics
                </button>
                {currentUser.role === "admin" && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      activeTab === "admin"
                        ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-400" /> Admin Suite
                  </button>
                )}
              </nav>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Database className="w-3.5 h-3.5" /> MongoDB Connected
            </div>
            <p className="text-[10px] text-slate-500">jinvexa.5qfbxth.mongodb.net</p>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 bg-slate-950 overflow-y-auto p-6">
          {/* TAB 1: GOAL DISCOVERY */}
          {activeTab === "discovery" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <Compass className="w-6 h-6 text-indigo-400" /> Goal-Based Learning Discovery
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Enter your target career goal or technical objective. Jinvexa will formulate your tailored curriculum.
                </p>
              </div>

              {/* Goal Input Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  What do you want to learn?
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="e.g., 'I want to become an AI Engineer' or 'Master LLM Architectures'"
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none"
                  />
                  <button
                    onClick={() => setDiscoveryStep(1)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 text-sm"
                  >
                    Analyze Goal <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Discovery Conversation Flow */}
              {discoveryStep >= 1 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" /> AI Diagnostic Questions
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm space-y-2">
                      <p className="text-indigo-400 font-semibold">🤖 Agent Question 1/4:</p>
                      <p className="text-slate-200">
                        How would you rate your current experience with Python and Neural Networks?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                        {["Complete Beginner", "Intermediate (Built Basic Models)", "Advanced Engineer"].map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => setDiscoveryStep(2)}
                            className="p-2.5 bg-slate-900 hover:bg-indigo-600/20 hover:border-indigo-500/50 border border-slate-800 rounded-lg text-xs text-slate-300 text-left transition"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Learning Plan Roadmap */}
              {discoveryStep >= 2 && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" /> Generated Personalized Roadmap
                    </h3>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
                      Estimated: 60 Hours
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {[
                      { phase: 1, title: "Fundamentals & Math Foundations", hours: 16, topics: ["Linear Algebra", "Python for AI", "PyTorch Core"] },
                      { phase: 2, title: "Deep Learning & Transformers", hours: 16, topics: ["Attention Mechanisms", "Transformer Architecture", "BERT & GPT"] },
                      { phase: 3, title: "LLM Fine-Tuning & MLOps", hours: 16, topics: ["LoRA / QLoRA", "RAG Systems", "vLLM Deployment"] },
                      { phase: 4, title: "Capstone Project", hours: 12, topics: ["Autonomous Agent System Build"] },
                    ].map((item) => (
                      <div
                        key={item.phase}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4 hover:border-slate-700 transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-sm">
                          P{item.phase}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-200 text-sm">{item.title}</h4>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {item.hours} hrs
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.topics.map((tp, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] bg-slate-950 text-slate-400 border border-slate-800 px-2.5 py-0.5 rounded-md"
                              >
                                {tp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REFERENCE MATERIAL */}
          {activeTab === "reference" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-indigo-400" /> Reference-Based Learning
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Ingest PDFs, YouTube links, technical papers, or web documentation into Jinvexa.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Resource URL / File Location
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=... or https://arxiv.org/abs/..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
                  />
                  <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition text-sm">
                    Extract & Index
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEACHING LAYER */}
          {activeTab === "teaching" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-indigo-400" /> Teaching Layer & Course Player
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  AI format decision engine dynamically creates text or custom voice narration modules.
                </p>
              </div>

              {/* Course Watch Order & Player */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
                    Manifest Watch Order
                  </h3>
                  <div className="space-y-2">
                    {[
                      { title: "1. AI Architecture Overview", type: "audio", voice: "Female Warm" },
                      { title: "2. Transformer Math Syntax", type: "text", voice: "Self-Paced Text" },
                      { title: "3. Attention Mechanism Deep-Dive", type: "audio", voice: "Male Professional" },
                      { title: "4. MLOps Deployment Checklist", type: "text", voice: "Self-Paced Text" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/50 cursor-pointer transition space-y-1"
                      >
                        <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                        <div className="flex items-center gap-2">
                          {item.type === "audio" ? (
                            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                              <Volume2 className="w-3 h-3" /> {item.voice}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Text
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-mono">
                        Active Lesson: 1. AI Architecture Overview
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Volume2 className="w-4 h-4 text-purple-400" /> Warm Female Voice Mode
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 mb-3">Understanding the Scaling Gap</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Traditional education suffers from a fundamental bottleneck: one teacher cannot dynamically adapt a curriculum to 30 unique human learning patterns simultaneously. Jinvexa solves this by deploying multi-agent specialized LLMs...
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <button className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                      <Play className="w-5 h-5 ml-0.5" />
                    </button>
                    <div className="flex-1">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-indigo-500" />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span>02:15</span>
                        <span>06:40</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ASSIGNMENTS */}
          {activeTab === "assignments" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-indigo-400" /> AI Assignment & Auto-Grading Layer
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Custom evaluation suite configured automatically based on course complexity.
                </p>
              </div>

              {!assignmentSubmitted ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-200 text-sm">Module 1 Assessment: AI Systems</h3>
                      <p className="text-xs text-slate-400">Difficulty: Intermediate | Passing Threshold: 70%</p>
                    </div>
                    <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">
                      Time Limit: 20 mins
                    </span>
                  </div>

                  {/* Question 1 MCQ */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-200">
                      1. What is the main purpose of Attention Mechanisms in Transformer models?
                    </p>
                    <div className="space-y-2">
                      {[
                        "A. To process sentences sequentially word by word",
                        "B. To dynamically weight the importance of different words in a context window",
                        "C. To compress data for smaller memory footprint",
                        "D. To render visual UI elements",
                      ].map((opt, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/50 cursor-pointer text-xs text-slate-300"
                        >
                          <input
                            type="radio"
                            name="q1"
                            onChange={() => setSelectedAnswers({ ...selectedAnswers, 1: opt })}
                            className="text-indigo-600 focus:ring-0"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Question 2 Written Essay */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <p className="text-sm font-semibold text-slate-200">
                      2. Written Prompt: Compare and contrast RAG (Retrieval-Augmented Generation) with Fine-Tuning.
                    </p>
                    <textarea
                      rows={4}
                      placeholder="Type your structured answer here for LLM evaluation..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={() => setAssignmentSubmitted(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition text-sm"
                  >
                    Submit Assignment for AI Grading
                  </button>
                </div>
              ) : (
                /* Assignment Grade Output */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in zoom-in-95">
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 mb-2">
                      <Award className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-100">Grade: A (92%)</h3>
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                      ✅ PASSED ASSIGNMENT
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs text-slate-300">
                    <p className="font-bold text-indigo-400">🤖 AI Evaluator Feedback:</p>
                    <p>
                      Excellent grasp of Attention Mechanisms and context windows. Your written response regarding RAG architecture correctly identified static vs dynamic vector retrieval trade-offs.
                    </p>
                  </div>

                  <button
                    onClick={() => setAssignmentSubmitted(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs transition"
                  >
                    Retake Assessment
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MENTOR CHAT */}
          {activeTab === "mentoring" && (
            <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Jinvexa AI Learning Mentor</h3>
                    <p className="text-[10px] text-slate-400">Full Learning Memory Mode Active</p>
                  </div>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {mentorMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask a question or seek clarification on any topic..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: STATS */}
          {activeTab === "stats" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-400" /> Learning Analytics & Progress
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Total Sessions</p>
                  <p className="text-3xl font-extrabold text-indigo-400">14</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Mastered Concepts</p>
                  <p className="text-3xl font-extrabold text-purple-400">42</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Avg Assignment Score</p>
                  <p className="text-3xl font-extrabold text-emerald-400">88%</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ADMIN */}
          {activeTab === "admin" && currentUser.role === "admin" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-400" /> Admin Control Suite
              </h2>

              {/* Model Switcher */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Active Ollama LLM Model Switcher
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "gemma4:31b-cloud", name: "Gemma4 31B Cloud", desc: "Vision & OCR Supported" },
                    { id: "minimax-m3:cloud", name: "MiniMax M3 Cloud", desc: "High Context Window" },
                    { id: "gpt-oss:20b-cloud", name: "GPT-OSS 20B", desc: "Fast Text Generation" },
                    { id: "nemotron-3-super:cloud", name: "Nemotron 3 Super", desc: "NVIDIA Reasoning Engine" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveModel(m.id)}
                      className={`p-4 rounded-xl border text-left transition flex justify-between items-center ${
                        activeModel === m.id
                          ? "bg-purple-600/20 border-purple-500 text-purple-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-200">{m.name}</p>
                        <p className="text-[10px] text-slate-500">{m.desc}</p>
                      </div>
                      {activeModel === m.id && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
