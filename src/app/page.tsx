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
  Database,
  Layers,
  ArrowRight,
  Clock,
  Zap,
  Loader2,
} from "lucide-react";

type Role = "user" | "admin";
type Tab = "discovery" | "reference" | "teaching" | "assignments" | "mentoring" | "stats" | "admin";

interface User {
  username: string;
  role: Role;
  id: string;
}

export default function JinvexaApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("discovery");
  const [activeModel, setActiveModel] = useState("gemma4:31b-cloud (Live)");

  // Goal Discovery State
  const [goalInput, setGoalInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticQ, setDiagnosticQ] = useState<any>(null);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any[]>([]);

  // Mentor Chat State
  const [mentorMessages, setMentorMessages] = useState([
    { sender: "mentor", text: "Hello! I am Jinvexa AI Mentor. What would you like to master today?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Assignment State
  const [activeTopic, setActiveTopic] = useState("AI Systems Engineering");
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
  const [selectedMCQ, setSelectedMCQ] = useState<number | null>(null);
  const [essayText, setEssayText] = useState("");
  const [evalResult, setEvalResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === "admin" && loginPassword === "admin123") {
      setCurrentUser({ username: "admin", role: "admin", id: "1" });
      setAuthError("");
    } else if (loginUsername === "alice" && loginPassword === "alice123") {
      setCurrentUser({ username: "alice", role: "user", id: "2" });
      setAuthError("");
    } else if (loginUsername && loginPassword) {
      setCurrentUser({ username: loginUsername, role: "user", id: "3" });
      setAuthError("");
    } else {
      setAuthError("Invalid credentials. Try admin/admin123 or alice/alice123");
    }
  };

  // Real AI Goal Discovery Call
  const handleAnalyzeGoal = async () => {
    if (!goalInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalInput, currentStep: 1 }),
      });
      const data = await res.json();
      if (data.roadmap) {
        setGeneratedRoadmap(data.roadmap);
      }
      if (data.question) {
        setDiagnosticQ(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Real AI Mentor Chat Call
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isThinking) return;
    const newMsgs = [...mentorMessages, { sender: "user", text: chatInput }];
    setMentorMessages(newMsgs);
    setChatInput("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, activeCourse: goalInput }),
      });
      const data = await res.json();
      setMentorMessages([...newMsgs, { sender: "mentor", text: data.response }]);
    } catch (e) {
      setMentorMessages([...newMsgs, { sender: "mentor", text: "Error connecting to AI Reasoning Engine." }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Real AI Assignment Generation & Evaluation
  const handleGenerateAssignment = async () => {
    setIsLoadingAssignment(true);
    setEvalResult(null);
    try {
      const res = await fetch("/api/assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", topic: activeTopic }),
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
          topic: activeTopic,
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg mb-3">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              JINVEXA AI
            </h1>
            <p className="text-xs text-slate-400 mt-1">Autonomous AI Learning Platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin or alice"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none"
              />
            </div>
            {authError && <p className="text-xs text-rose-400 text-center">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            JINVEXA AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-full px-3 py-1 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Model: <strong className="text-indigo-400">{activeModel}</strong></span>
          </div>
          <button onClick={() => setCurrentUser(null)} className="text-slate-400 hover:text-rose-400 transition" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between hidden md:flex">
          <nav className="space-y-2">
            <button onClick={() => setActiveTab("discovery")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${activeTab === "discovery" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400"}`}>
              <Compass className="w-4 h-4" /> Goal Discovery
            </button>
            <button onClick={() => setActiveTab("teaching")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${activeTab === "teaching" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400"}`}>
              <BookOpen className="w-4 h-4" /> Teaching Layer
            </button>
            <button onClick={() => setActiveTab("assignments")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${activeTab === "assignments" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400"}`}>
              <CheckCircle2 className="w-4 h-4" /> AI Assignments
            </button>
            <button onClick={() => setActiveTab("mentoring")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${activeTab === "mentoring" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400"}`}>
              <MessageSquare className="w-4 h-4" /> AI Mentor Chat
            </button>
          </nav>
        </aside>

        {/* Viewport */}
        <main className="flex-1 bg-slate-950 overflow-y-auto p-6">
          {/* TAB 1: GOAL DISCOVERY */}
          {activeTab === "discovery" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <Compass className="w-6 h-6 text-indigo-400" /> Goal Discovery Engine
                </h2>
                <p className="text-sm text-slate-400 mt-1">Enter your goal and let Jinvexa AI formulate a custom curriculum.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Target Goal</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="e.g., 'Master Generative AI and LLM Engineering'"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
                  />
                  <button
                    onClick={handleAnalyzeGoal}
                    disabled={isAnalyzing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2 text-sm"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAnalyzing ? "AI Reasoning..." : "Generate Roadmap"}
                  </button>
                </div>
              </div>

              {generatedRoadmap.length > 0 && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" /> AI-Generated Roadmap
                  </h3>
                  <div className="grid gap-4">
                    {generatedRoadmap.map((item, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-slate-200 text-sm">Phase {item.phase}: {item.title}</h4>
                          <span className="text-xs text-slate-400 font-mono">{item.hours} hours</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.topics?.map((tp: string, i: number) => (
                            <span key={i} className="text-[11px] bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-md">
                              {tp}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEACHING LAYER */}
          {activeTab === "teaching" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" /> Teaching Layer & Course Player
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Module: {goalInput || "AI Systems Overview"}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Welcome to your customized lesson. This curriculum was autonomously structured by Jinvexa's concept extraction and dependency mapping agents.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNMENTS */}
          {activeTab === "assignments" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-indigo-400" /> AI Assignment & Auto-Grading Engine
              </h2>

              {!assignmentData ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                  <p className="text-sm text-slate-400">Generate a custom AI test based on your active learning goal.</p>
                  <button
                    onClick={handleGenerateAssignment}
                    disabled={isLoadingAssignment}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition text-xs inline-flex items-center gap-2"
                  >
                    {isLoadingAssignment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isLoadingAssignment ? "Generating Questions..." : "Generate AI Assignment"}
                  </button>
                </div>
              ) : !evalResult ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  {/* MCQ */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-200">1. {assignmentData.mcq?.question}</p>
                    <div className="space-y-2">
                      {assignmentData.mcq?.options.map((opt: string, idx: number) => (
                        <label key={idx} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300">
                          <input type="radio" name="mcq" onChange={() => setSelectedMCQ(idx)} className="text-indigo-600" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Essay */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <p className="text-sm font-semibold text-slate-200">2. {assignmentData.essay?.question}</p>
                    <textarea
                      rows={4}
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      placeholder="Type your response for AI grading..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmitAssignment}
                    disabled={isEvaluating}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2"
                  >
                    {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for AI Evaluation"}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="text-center space-y-1">
                    <Award className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="text-2xl font-bold text-slate-100">Grade: {evalResult.grade} ({evalResult.score}%)</h3>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 space-y-1">
                    <p className="font-bold text-indigo-400">🤖 AI Feedback:</p>
                    <p>{evalResult.feedback}</p>
                  </div>
                  <button onClick={() => setAssignmentData(null)} className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs text-slate-200">
                    Take New Test
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MENTOR CHAT */}
          {activeTab === "mentoring" && (
            <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-800 bg-slate-950">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" /> Jinvexa AI Mentor (Live Inference)
                </h3>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {mentorMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${msg.sender === "user" ? "bg-indigo-600 text-white" : "bg-slate-950 border border-slate-800 text-slate-200"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> AI Mentor is reasoning...
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask a technical question..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none"
                />
                <button onClick={handleSendMessage} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
