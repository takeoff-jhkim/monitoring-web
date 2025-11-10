import { apiClient } from "../client";
import { SYSTEM_BY_KEY } from "../../config/systems";
import { ENV } from "../../config/env";

const BASE_AGENT_RESPONSE = {
  total: 2,
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
      status: "WAITING_USER_INPUT",
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
