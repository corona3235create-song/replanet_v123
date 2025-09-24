import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  useEffect
} from "react";

/**************************
 * 1) 정원 상태 & 액션 정의
 **************************/

type UnlockedItem = "watering_can" | "sparkle_effect" | "flower_pot" | "butterfly";

type GardenState = {
  level: number;
  xp: number;
  waterGauge: number;
  sparkles: boolean;
  unlocked: Set<UnlockedItem>;
  lastEvent?: string;
};

type GardenAction =
  | { type: "EARN_XP_FROM_CO2"; grams: number }
  | { type: "WATER_PLANT"; amount?: number }
  | { type: "POSITIVE_FEEDBACK" }
  | { type: "UNLOCK"; item: UnlockedItem }
  | { type: "TOGGLE_SPARKLES"; on: boolean }
  | { type: "RESET_EVENT" };

const initialState: GardenState = {
  level: 1,
  xp: 0,
  waterGauge: 0,
  sparkles: false,
  unlocked: new Set<UnlockedItem>(["watering_can"])
};

function xpToLevel(xp: number): number {
  return Math.max(1, Math.floor(xp / 1000) + 1);
}

function gardenReducer(state: GardenState, action: GardenAction): GardenState {
  switch (action.type) {
    case "EARN_XP_FROM_CO2": {
      const addXp = Math.max(0, Math.round(action.grams));
      const xp = state.xp + addXp;
      const level = xpToLevel(xp);
      const unlocked = new Set(state.unlocked);
      if (level >= 3) unlocked.add("flower_pot");
      if (level >= 5) unlocked.add("butterfly");
      return { ...state, xp, level, lastEvent: `+${addXp}xp (CO₂)`, unlocked };
    }
    case "WATER_PLANT": {
      const amount = action.amount ?? 20;
      const waterGauge = Math.min(100, state.waterGauge + amount);
      return { ...state, waterGauge, lastEvent: `물주기 +${amount}` };
    }
    case "POSITIVE_FEEDBACK": {
      const xp = state.xp + 50;
      const level = xpToLevel(xp);
      const unlocked = new Set(state.unlocked);
      unlocked.add("sparkle_effect");
      return { ...state, xp, level, sparkles: true, lastEvent: "칭찬 보너스!" , unlocked };
    }
    case "UNLOCK": {
      const unlocked = new Set(state.unlocked);
      unlocked.add(action.item);
      return { ...state, unlocked, lastEvent: `아이템 잠금 해제: ${action.item}` };
    }
    case "TOGGLE_SPARKLES": {
      return { ...state, sparkles: action.on };
    }
    case "RESET_EVENT": {
      return { ...state, lastEvent: undefined };
    }
    default:
      return state;
  }
}

/**************************
 * 2) 컨텍스트
 **************************/

type GardenContextValue = {
  state: GardenState;
  dispatch: React.Dispatch<GardenAction>;
  earnFromCO2: (grams: number) => Promise<void>;
  water: (amount?: number) => void;
  praise: () => void;
};

const GardenContext = createContext<GardenContextValue | null>(null);

export const GardenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gardenReducer, initialState);

  const persistEvent = useCallback(async (_payload: Record<string, unknown>) => {
    // TODO: 실제 API 연동
  }, []);

  const earnFromCO2 = useCallback(async (grams: number) => {
    dispatch({ type: "EARN_XP_FROM_CO2", grams });
    await persistEvent({ type: "earn", grams });
  }, [persistEvent]);

  const water = useCallback((amount?: number) => {
    dispatch({ type: "WATER_PLANT", amount });
    void persistEvent({ type: "water", amount: amount ?? 20 });
  }, [persistEvent]);

  const praise = useCallback(() => {
    dispatch({ type: "POSITIVE_FEEDBACK" });
    void persistEvent({ type: "praise" });
    setTimeout(() => dispatch({ type: "TOGGLE_SPARKLES", on: false }), 2000);
  }, [persistEvent]);

  const value = useMemo(() => ({ state, dispatch, earnFromCO2, water, praise }), [state, earnFromCO2, water, praise]);

  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>;
};

export function useGarden() {
  const ctx = useContext(GardenContext);
  if (!ctx) throw new Error("useGarden must be used within GardenProvider");
  return ctx;
}

/**************************
 * 3) 정원 UI
 **************************/

const GardenView: React.FC = () => {
  const { state, water } = useGarden();
  const { level, xp, waterGauge, sparkles, unlocked, lastEvent } = state;

  return (
    <div className="garden-card">
      <h3>나만의 정원</h3>
      <p>Lv.{level} | {xp} xp</p>
      <div className="garden-stage">
        <div className={`plant stage-${Math.min(5, Math.max(1, level))}`} />
        {unlocked.has("flower_pot") && <div className="flower-pot" />}
        {unlocked.has("butterfly") && <div className="butterfly" />}
        {sparkles && <div className="sparkles">✨</div>}
      </div>
      <div className="gauge">
        <div className="gauge-bar" style={{ width: `${waterGauge}%` }} />
      </div>
      <button onClick={() => water(25)}>물 주기</button>
      {lastEvent && <div className="event-toast">{lastEvent}</div>}
    </div>
  );
};

/**************************
 * 4) 챗봇 UI
 **************************/

type ChatMessage = { role: "user" | "assistant"; text: string };

const ChatPanel: React.FC = () => {
  const { earnFromCO2, praise, water } = useGarden();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "안녕하세요! 오늘 대중교통을 이용하셨나요?" }
  ]);
  const [input, setInput] = useState("");

  const push = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

  const interpretAndAct = useCallback(async (utter: string) => {
    const text = utter.trim().toLowerCase();
    if (/(버스|지하철|대중교통)/.test(text)) {
      const grams = 1200;
      push({ role: "assistant", text: `오늘 ${grams}g CO₂ 절약! 정원 반영합니다 🌱` });
      await earnFromCO2(grams);
      water(15);
      return;
    }
    if (/(칭찬|잘했)/.test(text)) {
      push({ role: "assistant", text: "정말 멋져요! 반짝임 효과 추가 ✨" });
      praise();
      return;
    }
    if (/물/.test(text)) {
      push({ role: "assistant", text: "물을 줬습니다 💧" });
      water(25);
      return;
    }
    push({ role: "assistant", text: "예: '버스 탔어', '칭찬', '물줘' 라고 입력해보세요." });
  }, [earnFromCO2, praise, water]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    push({ role: "user", text: input });
    const utter = input;
    setInput("");
    await interpretAndAct(utter);
  };

  return (
    <div className="chat-card">
      <h3>에코 챗봇</h3>
      <div className="chat-thread">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.text}</div>
        ))}
      </div>
      <form onSubmit={onSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="메시지를 입력하세요" />
        <button type="submit">전송</button>
      </form>
    </div>
  );
};

/**************************
 * 5) 통합 레이아웃 (정원 + 챗봇)
 **************************/

export const GardenWithChat: React.FC = () => {
  const { dispatch } = useGarden();
  const containerRef = useRef<HTMLDivElement | null>(null);  // ✅ useRef 사용 추가

  // 자동으로 토스트 초기화
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: "RESET_EVENT" }), 2500);

    // ✅ useRef 활용: 마운트 시 컨테이너에 포커스 주기
    if (containerRef.current) {
      containerRef.current.focus();
    }

    return () => clearInterval(t);
  }, [dispatch]);

  return (
    <div ref={containerRef} tabIndex={-1} className="grid">   {/* ref 적용 */}
      <GardenView />
      <ChatPanel />
      <style>{baseStyles}</style>   {/* ✅ baseStyles 실제 사용 */}
    </div>
  );
};
/**************************
 * 6) 내장 스타일
 **************************/

const baseStyles = `
:root { --card: #ffffff; --muted:#f5f7f8; --ink:#111827; --accent:#059669; --ring:#a7f3d0; }
* { box-sizing: border-box; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.garden-card, .chat-card { background: var(--card); border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.garden-header { display:flex; align-items:center; justify-content: space-between; margin-bottom: 12px; }
.garden-stage { position: relative; height: 260px; background: linear-gradient(180deg, #e6fff2 0%, #f7fffb 100%); border:1px solid #d1fae5; border-radius: 16px; overflow: hidden; }
.soil { position:absolute; bottom:0; left:0; right:0; height: 56px; background: #8b5a2b; }
.plant { position:absolute; bottom:56px; left:50%; transform:translateX(-50%); width: 12px; background:#3b945e; border-radius: 6px; }
.plant.stage-1 { height: 40px; }
.plant.stage-2 { height: 70px; }
.plant.stage-3 { height: 100px; }
.plant.stage-4 { height: 130px; }
.plant.stage-5 { height: 160px; }
.flower-pot { position:absolute; bottom:52px; left: calc(50% - 60px); width: 50px; height: 34px; background:#d97706; border-radius: 4px 4px 10px 10px; }
.butterfly { position:absolute; bottom: 160px; left: calc(50% + 40px); width: 24px; height: 18px; animation: fly 3s ease-in-out infinite; }
@keyframes fly { 0%,100%{ transform: translate(0,0);} 50% { transform: translate(6px,-10px);} }
.sparkles { position:absolute; inset:0; pointer-events:none; }
.gauge { margin-top: 12px; background: var(--muted); border-radius: 10px; height: 12px; }
.gauge-bar { height:100%; background: linear-gradient(90deg, var(--accent), #10b981); }
.gauge-label { margin-top: 4px; font-size: 12px; }
.chat-thread { height: 230px; overflow:auto; background: #f8fafc; border:1px solid #e5e7eb; border-radius: 12px; padding: 8px; }
.msg { padding: 8px 10px; border-radius: 10px; margin: 6px 0; max-width: 86%; line-height: 1.3; }
.msg.user { margin-left:auto; background:#d1fae5; }
.msg.assistant { margin-right:auto; background:white; border:1px solid #e5e7eb; }
.chat-input { display:flex; gap:8px; margin-top: 8px; }
.chat-input input { flex:1; border:1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
.btn { background:#10b981; color:white; border:none; padding: 8px 12px; border-radius: 10px; cursor:pointer; font-weight:600; }
.event-toast { margin-top: 10px; background:#111827; color:white; border-radius: 10px; padding: 8px 10px; width:max-content; }
@media (max-width: 920px){ .grid { grid-template-columns: 1fr; } }
`;

export default GardenWithChat;
