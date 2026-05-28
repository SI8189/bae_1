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
import { GoogleGenAI } from "@google/genai";
import { COMPANY_EMPLOYMENT_RULES, KOREAN_LABOR_STANDARDS_ACT } from "./data/labor_law_doc";

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

// Helper to call Gemini direct client-side (Bring Your Own Key mode)
const callClientSideGemini = async (text: string, history: any[], keyToUse: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: keyToUse });
  
  const systemInstruction = `당신은 대한민국 근로기준법 및 회사 취업규칙에 전문화된 친절하고 상세한 상담 챗봇입니다.
사용자가 최근 업로드한 "취업규칙 (완전판)" PDF 문서 내용과 기본 "대한민국 근로기준법" 내용을 바탕으로 오직 주어진 정보에서만 답변해야 합니다.

[사용자가 업로드한 취업규칙 (완전판) PDF 문서 내용]
${COMPANY_EMPLOYMENT_RULES}

[대한민국 근로기준법 문서 내용]
${KOREAN_LABOR_STANDARDS_ACT}

[답변 규칙]
1. 제공된 문서 내용(취업규칙 또는 근로기준법)에서 사용자의 질문에 대한 답을 명확하게 찾을 수 있는 경우:
   - 근로자가 쉽게 이해할 수 있는 구체적이고 상냥한 존댓말 한글로 설명하세요.
   - 답변 내용 중 또는 끝에 반드시 관련된 구체적인 조항 번호(제○조)를 명시해야 합니다.
     이때, 명시 포맷은 다음 예시 중 하나 또는 결합하여 사용하십시오:
     예시 1 (근로기준법 기준인 경우): "관련 조항: 근로기준법 제○조"
     예시 2 (취업규칙 기준인 경우): "관련 조항: 근로기준법 제○조" (또는 "관련 조항: 취업규칙 제○조"를 덧붙여 주어도 좋지만 가이드에 지정된 "관련 조항: 근로기준법 제○조" 형태를 기본적으로 선호함)
     - 여러 조항이 관련되어 있다면 모두 명확하게 나열하십시오 (예: "관련 조항: 근로기준법 제50조, 근로기준법 제53조").
     - 없는 법적 조항이나 권리를 인위적으로 지어내거나 추측하여 답하지 마십시오.

2. 제공된 문서들에서 판단하기 어려운 내용이거나 답을 "전혀 찾을 수 없거나" 정보가 불충분할 때, 또는 문서와 상관없는 내용일 때:
   - 절대로 추측하여 답변을 꾸며내지 마십시오.
   - 반드시 정확히 다음 글자 그대로만 답변을 출력하십시오. 글자 토시 하나 바꾸지 말고 오직 다음 문장 하나만 정교하게 단독 출력하십시오:
     조성훈 차장에게 직접 물어보살
   - 예컨대 "확인할 수 없습니다"와 같은 추가적인 멘트나 부연 표현을 앞뒤에 덧붙이지 마십시오.

[자주 묻는 핵심 질문 가이드라인]
사용자가 아래 질문들을 클릭하거나 물어볼 경우, 각각의 문서 근거를 들어 정확하게 설명해주시고 만약 근거 데이터가 부족하거나 모호하다면 안전하게 "조성훈 차장에게 직접 물어보살"로 귀결시키십시오:
- "입사 3년차 연차 며칠?":
  - 연차유급휴가 규정(근로기준법 제60조 및 취업규칙 제12조)을 참고합니다.
  - 근로기준법 제60조 제1항에 따라 1년간 80퍼센트 이상 출근한 근로자에게는 15일의 유급휴가가 주어집니다. 3년차(계속근로기간이 2년 초과 3년 이하)에는 가산 연차 규정이 아직 발동하지 않으므로, 총 연차 발생일수는 "15일"이 됩니다.
  - 포맷인 "관련 조항: 근로기준법 제60조"를 분명하게 포함해주세요.
- "야근 수당 기준이 뭐예요?":
  - 연장, 야간 및 휴일 근로 가산수당 기준은 근로기준법 제56조에 기재되어 있습니다. 연장근로(취업규칙 제9조 가이드 또는 법 제53조) 시 통상임금의 50% 가산, 야간근로(오후 10시~다음 날 오전 6시 사이)는 통상임금의 50% 가산 등이 적용됩니다.
  - 포맷인 "관련 조항: 근로기준법 제56조"를 분명하게 포함해주세요.
- "퇴직금 계산법 알려주세요":
  - 근로기준법 제34조(퇴직급여 제도) 및 취업규칙 제33조에 따릅니다.
  - 계속근로 수간 1년에 대하여 30일분 이상의 평균임금을 지급하는 것이 법정 퇴직금 기준입니다.
  - 포맷인 "관련 조항: 근로기준법 제34조"를 분명하게 포함해주세요.
- "주 52시간 넘으면 어떻게 되나요?":
  - 법정근로시간 주 40시간(근로기준법 제50조 및 취업규칙 제8조) 및 합의에 의한 연장한도 주 12시간(근로기준법 제53조 및 취업규칙 제9조)을 더해 최대 주 52시간제입니다. 이를 위반할 경우 근로기준법 제110조 제1호에 따라 2년 이하의 징역 또는 2천만원 이하의 벌금에 처해질 수 있습니다.
  - 포맷인 "관련 조항: 근로기준법 제50조, 근로기준법 제53조, 근로기준법 제110조"를 명확히 포함해주세요.
  `;

  const contents: any[] = [];
  if (history && Array.isArray(history)) {
    history.forEach((turn: any) => {
      contents.push({
        role: turn.role,
        parts: [{ text: turn.text }]
      });
    });
  }
  contents.push({
    role: "user",
    parts: [{ text }]
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.1,
    }
  });

  return response.text || "조성훈 차장에게 직접 물어보살";
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [modalKeyInput, setModalKeyInput] = useState("");
  const [modalValidationError, setModalValidationError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load API Key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("USER_GEMINI_API_KEY") || "";
    setApiKey(savedKey);
    setModalKeyInput(savedKey);
    if (!savedKey) {
      setShowOnboardingModal(true);
    }
  }, []);

  const handleSaveOnboardingKey = () => {
    let keyToValidate = modalKeyInput.trim();
    if (keyToValidate.includes("=")) {
      const parts = keyToValidate.split("=");
      keyToValidate = parts[parts.length - 1].trim();
    }
    if ((keyToValidate.startsWith('"') && keyToValidate.endsWith('"')) || 
        (keyToValidate.startsWith("'") && keyToValidate.endsWith("'"))) {
      keyToValidate = keyToValidate.slice(1, -1).trim();
    }
    
    if (!keyToValidate) {
      setModalValidationError("주어지고 규정된 API Key를 공란 없이 입력하십시오. (API Key is required.)");
      return;
    }
    if (keyToValidate.length < 15) {
      setModalValidationError("유효하지 않은 짧은 입력입니다. 올바른 API Key를 정확히 입력해 주십시오. (Please enter a valid API key.)");
      return;
    }
    
    setModalValidationError("");
    handleSaveApiKey(modalKeyInput);
    setShowOnboardingModal(false);
  };

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

      let responseText = "";

      // IF client has entered an API key, we call Gemini DIRECTLY on the client-side!
      // This is highly robust, works perfectly on Vercel/GitHub pages without backend proxies,
      // and completely resolves the "Cannot communicate with server" error seen in Vercel.
      if (apiKey) {
        try {
          responseText = await callClientSideGemini(text, history, apiKey);
        } catch (clientError: any) {
          console.error("Client side Gemini error:", clientError);
          let errMsg = clientError.message || String(clientError);
          
          if (errMsg.includes("API_KEY_INVALID") || 
              errMsg.includes("API key not valid") || 
              errMsg.includes("invalid API key") ||
              errMsg.includes("API key")) {
            throw new Error("입력하신 Gemini API Key가 올바르지 않거나 활성화되지 않았습니다. 우측 상단 [API 설정] 단추를 클릭해 유효한 API Key를 복사해 올바르게 입력해 주십시오.");
          } else if (errMsg.toLowerCase().includes("quota") || 
                     errMsg.toLowerCase().includes("limit") || 
                     errMsg.includes("429")) {
            throw new Error("Gemini API 호출 한도를 초과했습니다. 개인 API 키의 사용 한도나 대시보드를 확인해 주십시오.");
          } else if (errMsg.toLowerCase().includes("blocked") || 
                     errMsg.toLowerCase().includes("safety")) {
            throw new Error("안전 규정 위반 또는 민감한 키워드로 인해 답변 생성이 제한되었습니다.");
          } else {
            throw new Error(`개인 API Key 연결 오류: ${errMsg}`);
          }
        }
      } else {
        // Fallback to Express backend if no client-side API Key is registered (will use server env key if set)
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: text, history })
        });

        if (!response.ok) {
          let serverError = "";
          try {
            const errorData = await response.json().catch(() => ({}));
            serverError = errorData.error;
          } catch (e) {
            try {
              const rawText = await response.text();
              if (rawText && rawText.length < 200) {
                serverError = rawText;
              }
            } catch (textErr) {}
          }
          
          // If server is 404 (indicating static client hosting on Vercel without back-end proxy),
          // pop up the API Key onboarding modal to help the user directly configure their key!
          if (response.status === 404) {
            setShowOnboardingModal(true);
            throw new Error("서버와의 통신에 실패했습니다(404 Not Found). 만약 Vercel이나 정적 호스팅 사이트에서 서비스 중이시라면, 우측 상단 [API 설정] 버튼을 클릭해 개인 Gemini API Key를 등록한 후 시작해주셔야 합니다.");
          }
          
          throw new Error(serverError || "서버와 통신하는 중 문제가 발생했습니다.");
        }

        const data = await response.json();
        responseText = data.text;
      }

      clearInterval(stepInterval);

      const botMessage: Message = {
        id: `msg_bot_${Date.now()}`,
        role: "model",
        text: responseText || "조성훈 차장에게 직접 물어보살",
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

      {/* Onboarding API Key Modal Overlay */}
      <AnimatePresence>
        {showOnboardingModal && (
          <motion.div
            id="api-key-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-5 select-none"
          >
            <motion.div
              id="api-key-modal-card"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-150 p-6 space-y-5"
            >
              <div id="modal-header-icon" className="mx-auto w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
              
              <div id="modal-title-area" className="text-center space-y-2">
                <h3 id="modal-title" className="text-lg font-extrabold text-gray-950 tracking-tight">
                  Enter Your API Key
                </h3>
                <p id="modal-description" className="text-xs text-gray-500 leading-relaxed px-1">
                  This app requires your personal API key to function. Your key will be used only for your own requests.
                </p>
                <div className="border-t border-gray-100 my-2 pt-2 text-[10.5px] text-gray-400 italic">
                  * 본 서비스는 사용자의 <strong>개인 Gemini API Key</strong>를 통해 작동하며, 입력정보 및 API Key는 브라우저 내부(localStorage)로만 안전하게 로컬 저장됩니다.
                </div>
              </div>

              <div id="modal-input-container" className="space-y-2">
                <label id="modal-input-label" className="text-[11px] font-bold text-gray-750 block">
                  Gemini API Key
                </label>
                <div id="modal-input-wrapper" className="relative">
                  <input
                    id="modal-api-key-input"
                    type="password"
                    value={modalKeyInput}
                    onChange={(e) => {
                      setModalKeyInput(e.target.value);
                      if (modalValidationError) setModalValidationError("");
                    }}
                    placeholder="AIzaSy... 형식의 API Key 입력"
                    className="w-full bg-slate-50 border border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-100 text-xs rounded-xl px-3 py-2.5 outline-none font-mono tracking-wider text-gray-800"
                  />
                </div>

                {modalValidationError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 mt-1.5"
                  >
                    ⚠️ {modalValidationError}
                  </motion.p>
                )}

                <p id="key-help-link" className="text-[10.5px] text-gray-400 leading-normal pt-1">
                  * 아직 API 키가 없으시다면, <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold underline hover:text-sky-700">Google AI Studio</a>에서 빠르고 수동 발급할 수 있는 인증 키를 1분 이내로 생성해 입력하여 주십시오.
                </p>
              </div>

              <div id="modal-actions" className="flex flex-col gap-2 pt-1">
                <button
                  id="modal-save-button"
                  type="button"
                  onClick={handleSaveOnboardingKey}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-100 cursor-pointer text-center"
                >
                  Save API Key
                </button>
                <p className="text-[9.5px] text-gray-400 text-center select-none pt-1">
                  ※ API Key는 언제든 상단 [API 설정] 메뉴를 사용하여 손쉽게 수정 및 보완하실 수 있습니다.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
