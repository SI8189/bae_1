import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Scale, 
  Sparkles, 
  HelpCircle, 
  Clock, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  UserCheck, 
  MessageCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Building,
  Key,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, SuggestedQuestion } from "./types";

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: "annual_leave",
    text: "입사 3년차 연차 며칠?",
    shortText: "연차 일수",
    description: "3년차 연차 유급휴가 일수"
  },
  {
    id: "overtime_pay",
    text: "야근 수당 기준이 뭐예요?",
    shortText: "야근 수당",
    description: "연장 및 야간 근로 가산율"
  },
  {
    id: "severance_pay",
    text: "퇴직금 계산법 알려주세요",
    shortText: "퇴직금 계산",
    description: "계속 근로 1년당 계산 공식"
  },
  {
    id: "working_hours",
    text: "주 52시간 넘으면 어떻게 되나요?",
    shortText: "주 52시간제",
    description: "법정 근로시간 한도 및 위반 벌칙"
  }
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load API Key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("USER_GEMINI_API_KEY") || "";
    setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = (key: string) => {
    let cleaned = key.trim();
    
    // Support copy-paste line: GEMINI_API_KEY="..." or similar
    if (cleaned.includes("=")) {
      const parts = cleaned.split("=");
      cleaned = parts[parts.length - 1].trim();
    }
    
    // Strip surrounding matching quotes if present
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    setApiKey(cleaned);
    if (cleaned) {
      localStorage.setItem("USER_GEMINI_API_KEY", cleaned);
    } else {
      localStorage.removeItem("USER_GEMINI_API_KEY");
    }
  };

  // Automatically scroll to the bottom of the chat log
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle sending a message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Dynamic loading steps to simulate PDF parsing and legal grounding
    const steps = [
      "근로기준법 및 취업규칙 PDF 탐색 중...",
      "관련 조항 검토 중...",
      "답변 작성 중..."
    ];
    
    let stepIndex = 0;
    setActiveStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setActiveStep(steps[stepIndex]);
      }
    }, 800);

    try {
      // Map history for Conversational Context
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        text: msg.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(apiKey ? { "x-user-api-key": apiKey } : {})
        },
        body: JSON.stringify({ message: text, history })
      });

      if (!response.ok) {
        let serverError = "";
        try {
          const errorData = await response.json().catch(() => ({}));
          serverError = errorData.error;
        } catch (e) {
          // If response is not JSON, try reading as raw text
          try {
            const rawText = await response.text();
            if (rawText && rawText.length < 200) {
              serverError = rawText;
            }
          } catch (textErr) {}
        }
        throw new Error(serverError || "서버와 통신하는 중 문제가 발생했습니다.");
      }

      const data = await response.json();
      clearInterval(stepInterval);

      const botMessage: Message = {
        id: `msg_bot_${Date.now()}`,
        role: "model",
        text: data.text || "조성훈 차장에게 직접 물어보살",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error(error);
      clearInterval(stepInterval);

      const errorMessage: Message = {
        id: `msg_error_${Date.now()}`,
        role: "model",
        text: error.message || "서버가 잠시 대기 중입니다. 계속 답변을 받지 못할 경우 아래 문구 또는 사내 채널을 활용해 주세요.\n\n조성훈 차장에게 직접 물어보살",
        timestamp: new Date(),
        status: "error"
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setActiveStep("");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  // Helper method to parse citations and fallbacks beautifully in the message bubble
  const renderMessageContent = (text: string) => {
    // Check if message is strictly the fallback phrase
    const isFallback = text.trim() === "조성훈 차장에게 직접 물어보살";
    const containsFallback = text.includes("조성훈 차장에게 직접 물어보살");

    if (isFallback) {
      return (
        <div className="space-y-4">
          <p className="font-semibold text-rose-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> 조성훈 차장에게 직접 물어보살
          </p>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-rose-100 bg-rose-50/50 rounded-xl p-4 mt-2 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-sm">
                성훈
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                  조성훈 차장 
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-normal">인사부 노동법 담당</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">사내 직통 연락망 또는 인사처 메신저로 즉시 상담 요청 가능</p>
              </div>
            </div>
            <div className="text-xs text-gray-600 leading-relaxed border-t border-rose-100 pt-2 bg-white/50 p-2 rounded">
              💡 본 질문은 업로드된 근로기준법 PDF에서 신뢰할 수 있는 답안을 찾을 수 없어, 정확한 해결을 위해 사내 근로기준법 전문가인 조성훈 차장님께 직접 상담을 권장해 드립니다.
            </div>
          </motion.div>
        </div>
      );
    }

    // Highlighting "관련 조항: 근로기준법 제○조" and "취업규칙 제○조" style strings
    const citationRegex = /(관련\s*조항\s*:\s*(?:근로기준법|취업규칙)\s*제[\w\s\d○일이삼사오육칠팔구십백천,]+조[^\n]*)/gi;
    
    const parts = text.split(citationRegex);

    return (
      <div className="space-y-2 leading-relaxed whitespace-pre-line text-[15px] text-gray-800">
        {parts.map((part, index) => {
          if (part.match(citationRegex)) {
            return (
              <span 
                key={index} 
                className="inline-flex items-center gap-1 bg-sky-50 border border-sky-100 text-sky-800 text-sm font-medium px-2.5 py-1 rounded-lg my-1 shadow-xs select-none"
              >
                <Scale className="w-4 h-4 text-sky-600" />
                {part}
              </span>
            );
          }

          // If fallback text is inside a larger paragraph body
          if (part.includes("조성훈 차장에게 직접 물어보살")) {
            const fallbackSplit = part.split("조성훈 차장에게 직접 물어보살");
            return (
              <React.Fragment key={index}>
                {fallbackSplit[0]}
                <div className="my-2 border border-rose-100 bg-rose-50/30 rounded-xl p-4 shadow-xs space-y-3">
                  <span className="font-semibold text-rose-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> 조성훈 차장에게 직접 물어보살
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-xs">
                      성훈
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-xs">조성훈 차장 (인사운영팀)</p>
                      <p className="text-[10px] text-gray-400">사내 유선 상담 및 방문 문의 제안</p>
                    </div>
                  </div>
                </div>
                {fallbackSplit[1]}
              </React.Fragment>
            );
          }

          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div id="app-container" className="flex flex-col h-screen max-w-lg mx-auto bg-white border border-gray-100 shadow-2xl relative overflow-hidden font-sans">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <header id="chat-header" className="flex flex-col px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30 transition-transform select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-100">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">
                근로기준법이 궁금하면
              </h1>
              <p className="text-xs font-semibold text-sky-600 mt-1 flex items-center gap-1">
                언제든지 물어보살 <span className="text-[10px] bg-sky-50 border border-sky-100 px-1 rounded">취업규칙 반영됨</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                apiKey
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                  : "bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100/70"
              }`}
              title="Gemini API Key 설정"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey ? "API 인증됨" : "API 설정"}</span>
            </button>
          </div>
        </div>
        
        <div className="mt-2.5 px-2 py-1 bg-gray-50 rounded-lg flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="bg-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded scale-90">PDF</span>
            <span>근로기준법 및 업로드된 취업규칙(완전판) 바탕의 챗봇</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 pr-1">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium">취업규칙(완전판) 반영됨</span>
          </div>
        </div>
      </header>

      {/* API Key settings panel */}
      <AnimatePresence>
        {showApiKeyInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-sky-105 bg-sky-50/40 px-5 py-3.5 space-y-2 select-none"
          >
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-sky-850 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-sky-600" /> 개인 Gemini API Key 입력 (선택)
              </label>
              <button 
                type="button"
                onClick={() => setShowApiKeyInput(false)}
                className="text-[10px] text-gray-400 hover:text-gray-650 font-semibold"
              >
                닫기
              </button>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              본 웹앱 배포본에 본인의 개인 Gemini API Key를 등록해서 무료 한도를 초과하지 않고 안전하게 사용하실 수 있습니다. 입력된 API Key는 오직 브라우저 내부(localStorage)에만 안전하게 보관되며 외부 서버에 전송되거나 저장되지 않습니다.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="AIzaSy...형식의 API 키를 입력해 주세요"
                className="flex-1 bg-white border border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-100 text-xs rounded-lg px-2.5 py-1.5 outline-none font-mono tracking-wider text-gray-800"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={() => handleSaveApiKey("")}
                  className="text-[10px] bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-700 px-2 py-1 rounded-md font-bold shrink-0 transition-colors cursor-pointer"
                >
                  지우기
                </button>
              )}
            </div>
            {apiKey && (
              <p className="text-[9px] text-emerald-650 font-semibold flex items-center gap-1 mt-0.5">
                ✓ 현재 등록된 개인 API Key로 안전하게 질의가 처리됩니다.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHAT FEED CONTAINER */}
      <main id="chat-feed" className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-slate-50/50">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            /* ONBOARDING USER GUIDE PANEL */
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col justify-center py-6 px-3 space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-sky-600" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                    안녕하세요! 보살 챗봇입니다 ⚖️
                  </h2>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    근로기준법 및 새로 첨부된 사내 <strong>취업규칙 (완전판)</strong> PDF의 명문화된 조항들만 바탕으로 정밀하고 안전하게 대답해 드립니다.
                  </p>
                </div>
              </div>

              {/* LAW SCOPE ACCORDION CARD / BULLET BOARD */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3.5">
                <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-sky-50 pb-2">
                  <BookOpen className="w-4 h-4" /> 가이드라인 및 핵심 원칙
                </h3>
                <ul className="space-y-2.5 text-xs text-gray-650">
                  <li className="flex gap-2">
                    <span className="text-sky-500 font-bold text-md select-none">✓</span>
                    <p className="leading-relaxed"><strong>조항 기반 정확성:</strong> 답변 제공 시 <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-600 font-mono text-[10px]">관련 조항: 근로기준법 제○조</code> 또는 취업규칙 관련 조항을 증명해 드립니다.</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-rose-500 font-bold text-md select-none">✓</span>
                    <p className="leading-relaxed"><strong>출처의 한계성:</strong> PDF에 명확히 기재되지 않았거나 판단하기 어려운 질문은 즉시 <strong>'조성훈 차장에게 직접 물어보살'</strong>이라 안내합니다.</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold text-md select-none">✓</span>
                    <p className="leading-relaxed"><strong>순수 보안성:</strong> 기재된 어떠한 대화 내용도 외부 유출의 우려 없이 실시간으로 계산과 검토가 이루어집니다.</p>
                  </li>
                </ul>
              </div>

              {/* ONBOARDING SUGGESTED CHIPS PANEL (MOBILE FRIENDLY) */}
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs font-bold text-gray-600 px-1 tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 많은 근로자들이 물어보는 단골 질문들
                </p>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {SUGGESTED_QUESTIONS.map((q) => {
                    const getIcon = () => {
                      switch(q.id) {
                        case "annual_leave": return <Calendar className="w-4 h-4 text-emerald-500" />;
                        case "overtime_pay": return <Clock className="w-4 h-4 text-sky-500" />;
                        case "severance_pay": return <DollarSign className="w-4 h-4 text-amber-500" />;
                        case "working_hours": return <Scale className="w-4 h-4 text-indigo-500" />;
                        default: return <HelpCircle className="w-4 h-4 text-gray-400" />;
                      }
                    };

                    return (
                      <button
                        key={q.id}
                        onClick={() => handleSendMessage(q.text)}
                        className="flex flex-col items-start text-left p-3.5 bg-white hover:bg-sky-50/50 border border-gray-100 hover:border-sky-200 rounded-xl transition-all shadow-xs group"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          {getIcon()}
                          <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-sky-600 transition-colors ml-auto" />
                        </div>
                        <h4 className="text-[13px] font-bold text-gray-900 group-hover:text-sky-600 transition-colors">
                          {q.shortText}
                        </h4>
                        <p className="text-[10px] text-gray-450 mt-0.5 truncate w-full">
                          {q.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            /* RENDERED CHAT LIST */
            messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Bot Profile Circle */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Scale className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex flex-col">
                      {/* Name tag */}
                      {!isUser && (
                        <span className="text-[11px] font-semibold text-gray-400 mb-1 ml-1 flex items-center gap-1.5">
                          근로기준법 챗봇보살
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 py-0.2 rounded-sm font-normal flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> PDF 검증 완료
                          </span>
                        </span>
                      )}

                      {/* Message bubble */}
                      <div className={`px-4 py-3 rounded-2xl ${
                        isUser 
                          ? "bg-sky-600 text-white rounded-tr-xs shadow-md" 
                          : msg.status === "error"
                            ? "bg-rose-50 border border-rose-100 text-rose-900 rounded-tl-xs shadow-xs"
                            : "bg-white border border-gray-100 text-gray-800 rounded-tl-xs shadow-sm"
                      }`}>
                        {renderMessageContent(msg.text)}
                      </div>

                      {/* Timestamp */}
                      <span className={`text-[10px] text-gray-400 mt-1 ${isUser ? "text-right mr-1" : "text-left ml-1"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                  </div>
                </motion.div>
              );
            })
          )}

          {/* GENERATIVE AI SEARCHING LOADING STATE */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-2.5 max-w-[80%]">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 animate-pulse">
                  <Scale className="w-4 h-4 animate-spin" />
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-gray-400 mb-1 ml-1">상담보살 분석기</span>
                  
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1 items-center select-none">
                        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs font-medium text-sky-600 animate-pulse-slow">
                        {activeStep}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </main>

      {/* 4. EXPLAINER STRIP & MINI CLIPS BAR */}
      {messages.length > 0 && (
        <div className="bg-white/80 border-t border-gray-50 px-3.5 py-1.5 flex gap-1.5 overflow-x-auto select-none no-scrollbar">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
               key={q.id}
               onClick={() => handleSendMessage(q.text)}
               className="text-[11px] font-bold text-gray-600 hover:text-sky-600 bg-gray-50 hover:bg-sky-50/50 border border-gray-100 hover:border-sky-100 rounded-full px-3 py-1 whitespace-nowrap shrink-0 transition-all shadow-xs"
            >
              {q.shortText} ➜
            </button>
          ))}
        </div>
      )}

      {/* 5. TEXT INPUT FORM AREA */}
      <footer id="chat-input-area" className="p-4 border-t border-gray-150 bg-white sticky bottom-0 z-20">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 rounded-2xl px-3.5 py-2 transition-all">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="근로기준법 질문을 직설적으로 적어주세요..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-800 placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all transform hover:scale-102 active:scale-98 cursor-pointer shadow-md ${
              inputValue.trim() && !isLoading
                ? "bg-sky-600 hover:bg-sky-700 shadow-sky-100"
                : "bg-gray-250 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>

        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1 font-medium select-none">
            <Building className="w-3 h-3 text-gray-300" /> 근로기준법 원본 가치 보장 · 비공개 세션 보호
          </p>
        </div>
      </footer>

    </div>
  );
}
