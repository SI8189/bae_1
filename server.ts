import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { COMPANY_EMPLOYMENT_RULES, KOREAN_LABOR_STANDARDS_ACT } from "./src/data/labor_law_doc";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up Gemini Client lazily or at module load safely
const getGeminiClient = (customApiKey?: string) => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key가 비어있습니다. 우측 상단의 [API 설정] 버튼을 눌러 본인의 Gemini API Key를 등록해주시거나, 관리자 .env 설정을 확인해주세요.');
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API routes go here FIRST
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const customApiKey = req.headers["x-user-api-key"] as string | undefined;
    const ai = getGeminiClient(customApiKey);

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
          role: turn.role, // 'user' or 'model'
          parts: [{ text: turn.text }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // low temperature enforces strict adherence to context
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating the response." });
  }
});

// Vite-aware server boot function
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
