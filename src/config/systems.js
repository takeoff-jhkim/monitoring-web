export const SYSTEM_DEFINITIONS = [
  {
    apiKey: "abc123",
    name: "Customer Care Router",
    description: "실시간 상담 티켓을 라우팅하는 메인 오케스트레이터.",
    owner: "CX-AI",
    environment: "prod",
    region: "ap-northeast-2",
    model: "gpt-4.1-mini",
    tags: ["routing", "support"],
  },
  {
    apiKey: "xyz789",
    name: "Docs Summarizer",
    description: "기술 문서를 요약하고 메타데이터를 생성합니다.",
    owner: "DocsOps",
    environment: "prod",
    region: "us-east-1",
    model: "claude-3.5-sonnet",
    tags: ["summarization", "metadata"],
  },
  {
    apiKey: "lab001",
    name: "Agent Lab",
    description: "신규 툴체인 실험 및 벤치마크용 랩 환경.",
    owner: "AI-Lab",
    environment: "stage",
    region: "us-west-2",
    model: "o1-mini",
    tags: ["experiments", "benchmark"],
  },
];

export const SYSTEM_BY_KEY = SYSTEM_DEFINITIONS.reduce((acc, system) => {
  acc[system.apiKey] = system;
  return acc;
}, {});
