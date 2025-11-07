export const SYSTEM_DEFINITIONS = [
  {
    apiKey: "rag-support-prod",
    name: "RAG Support Agent",
    description: "티켓 원문을 요약하고 적합한 플레이북으로 라우팅합니다.",
    owner: "CX-AI",
    environment: "prod",
    region: "ap-northeast-2",
    model: "gpt-4o-mini",
    tags: ["rag", "triage", "playbook"],
  },
  {
    apiKey: "billing-automation",
    name: "Billing Automation",
    description: "과금 이슈를 탐지해 FinOps 채널에 알립니다.",
    owner: "FinOps",
    environment: "prod",
    region: "us-east-1",
    model: "claude-3.5-sonnet",
    tags: ["finops", "alerting"],
  },
  {
    apiKey: "agent-lab-stage",
    name: "Agent Lab (Stage)",
    description: "신규 툴체인 실험 및 벤치마크 환경",
    owner: "AI-Lab",
    environment: "stage",
    region: "us-west-2",
    model: "o1-mini",
    tags: ["experiments", "benchmark"],
  },
  {
    apiKey: "warehouse-orchestrator",
    name: "Warehouse Orchestrator",
    description: "ETL 파이프라인 상태를 감시하는 멀티모달 에이전트",
    owner: "Data Platform",
    environment: "prod",
    region: "eu-central-1",
    model: "gemini-1.5-pro",
    tags: ["etl", "ops"],
  },
];

export const SYSTEM_BY_KEY = SYSTEM_DEFINITIONS.reduce((acc, system) => {
  acc[system.apiKey] = system;
  return acc;
}, {});
