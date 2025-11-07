import { apiClient } from "../client";

export const systemsApi = {
  // async getSystemList(page) {
  //   const response = await apiClient.get("/api/admin/systems", {
  //     page,
  //     headers: { "X-Admin-Key": import.meta.env.VITE_ADMIN_API_KEY },
  //   });
  //   if (!res.ok) {
  //     const text = await res.text().catch(() => "");
  //     throw new Error(`GET /api/admin/systems ${res.status} ${text}`);
  //   }
  //   return await response.json();
  // },

  getSystemList: async (page = 0, size = 20) => {
    const response = await apiClient.get("/api/admin/systems", {
      params: {
        page,
        size,
      },
    });
    return response.data;
  },
};
