import { apiClient } from "../client";
import { SYSTEM_BY_KEY } from "../../config/systems";
import { ENV } from "../../config/env";

const BASE_AGENT_RESPONSE = {
  total: 10,
  system: {
    environment: "dev",
    registered_at: "2025-10-08T05:32:08.233839Z",
    api_key: "sys_dev_0254e56f413f_71ec",
    system_name: "toa-k8s",
    organization_id: "toa-k8s-1",
    id: 5,
    health_status: "UNKNOWN",
    last_seen_at: "2025-10-14T05:17:50.581853Z",
    status: "ACTIVE",
  },
  pages: 1,
  success: true,
  current_page: 0,
  agents: [
    {
      user_email: "jj111@take-off.kr",
      agent_id: "7452fc4e-ef5f-4e2b-ab0b-66deecea4a07",
      agent_name: "기상봇-01",
      user_id: 2,
      created_at: "2025-10-17T09:21:58.208028Z",
      command: "날씨 알려줘",
      status: "WAITING_USER_INPUT",
    },
    {
      user_email: "jj111@take-off.kr",
      agent_id: "90c6da01-fc5f-4076-a3da-a8d8699709e0",
      agent_name: "기상봇-02",
      user_id: 2,
      created_at: "2025-10-20T09:28:48.669816Z",
      command: "날씨 알려줄래?",
      status: "EXECUTING_TOOL",
    },
    {
      user_email: "ops@take-off.kr",
      agent_id: "b6b4e7d5-056f-4de9-97ce-a2f930a9c2cb",
      agent_name: "기상봇-03",
      user_id: 4,
      created_at: "2025-10-22T05:41:28.903281Z",
      command: "태풍 경로 분석",
      status: "RESPONDING",
    },
    {
      user_email: "ops@take-off.kr",
      agent_id: "2f874302-1cc3-4c53-a2f9-1a99aaf6c8e8",
      agent_name: "기상봇-04",
      user_id: 4,
      created_at: "2025-10-23T02:11:14.109204Z",
      command: "주간 기상 리포트",
      status: "IDLE",
    },
    {
      user_email: "support@take-off.kr",
      agent_id: "9ab35791-6214-4364-9f93-01fc2e0eb8de",
      agent_name: "기상봇-05",
      user_id: 6,
      created_at: "2025-10-23T14:58:44.006118Z",
      command: "항공기 운항 체크",
      status: "WAITING_USER_INPUT",
    },
    {
      user_email: "support@take-off.kr",
      agent_id: "0f9140a9-35f7-4a67-9c1c-6dc3275a0d0c",
      agent_name: "기상봇-06",
      user_id: 6,
      created_at: "2025-10-23T16:21:51.219447Z",
      command: "실시간 기상특보",
      status: "EXECUTING_TOOL",
    },
    {
      user_email: "lab@take-off.kr",
      agent_id: "f3f25fc2-e6e1-4778-a3a4-7f435ba5601b",
      agent_name: "기상봇-07",
      user_id: 8,
      created_at: "2025-10-24T01:05:36.403972Z",
      command: "레이더 영상 정리",
      status: "RESPONDING",
    },
    {
      user_email: "lab@take-off.kr",
      agent_id: "c6ce3587-24b2-4817-a4f8-3fd10d56437a",
      agent_name: "기상봇-08",
      user_id: 8,
      created_at: "2025-10-24T03:44:17.112781Z",
      command: "기상청 API 동기화",
      status: "OFFLINE",
    },
    {
      user_email: "jj111@take-off.kr",
      agent_id: "5d414026-31ce-4d4c-8f1a-787742a7dfef",
      agent_name: "기상봇-09",
      user_id: 2,
      created_at: "2025-10-24T06:08:11.903418Z",
      command: "기온 변화 요약",
      status: "WAITING_USER_INPUT",
    },
    {
      user_email: "jj111@take-off.kr",
      agent_id: "5a681abc-6c34-4f6f-9d8c-c064db2c2ed5",
      agent_name: "기상봇-10",
      user_id: 2,
      created_at: "2025-10-24T09:44:59.777403Z",
      command: "비행 스케줄 조정",
      status: "FAILED",
    },
  ],
};

const buildMockAgentResponse = (apiKey) => {
  const systemMeta = SYSTEM_BY_KEY[apiKey] ?? {};
  const systemName = systemMeta.name ?? BASE_AGENT_RESPONSE.system.system_name;

  return {
    ...BASE_AGENT_RESPONSE,
    system: {
      ...BASE_AGENT_RESPONSE.system,
      api_key: apiKey,
      system_name: systemName,
      organization_id:
        systemMeta.owner ?? BASE_AGENT_RESPONSE.system.organization_id,
      environment:
        systemMeta.environment ?? BASE_AGENT_RESPONSE.system.environment,
      status: BASE_AGENT_RESPONSE.system.status,
    },
    agents: BASE_AGENT_RESPONSE.agents.map((agent, index) => ({
      ...agent,
      agent_name:
        agent.agent_name || `${systemName}-agent-${String(index + 1).padStart(2, "0")}`,
    })),
  };
};

export const agentsApi = {
  async getAgentsBySystemKey(apiKey, page = 0, size = 50) {
    if (ENV.USE_MOCK) {
      return buildMockAgentResponse(apiKey);
    }

    try {
      const response = await apiClient.get(
        `/api/admin/systems/${apiKey}/agents`,
        {
          params: { page, size },
        },
      );
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(
          "Falling back to mock agent response for",
          apiKey,
          error?.message ?? error,
        );
      }
      return buildMockAgentResponse(apiKey);
    }
  },
};
