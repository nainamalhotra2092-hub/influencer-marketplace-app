import type { Portrait, Upload, User } from "../types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export function fetchUser(userId: string) {
  return request<{ user: User }>(`/api/users/${userId}`);
}

export function registerUser(payload: Record<string, unknown>) {
  return request<{ user: User }>("/api/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestLoginOtp(email: string) {
  return request<{ email: string; sent: boolean; delivered: boolean; devOtp?: string }>("/api/login/otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyLoginOtp(email: string, code: string) {
  return request<{ user: User }>("/api/login/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function requestSignupOtp(email: string) {
  return request<{ target: string; sent: boolean; delivered: boolean; devOtp?: string }>("/api/signup/otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifySignupOtp(email: string, code: string) {
  return request<{ verified: boolean }>("/api/signup/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function completeProfile(userId: string, payload: Record<string, unknown>) {
  return request<{ user: User }>(`/api/users/${userId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchTalent(params: {
  query: string;
  gender: string;
  categories: string[];
  ages: string[];
  buyerId?: string;
  shortlistedOnly?: boolean;
}) {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.gender) search.set("gender", params.gender);
  if (params.categories.length) search.set("categories", params.categories.join(","));
  if (params.ages.length) search.set("ages", params.ages.join(","));
  if (params.buyerId) search.set("buyerId", params.buyerId);
  if (params.shortlistedOnly) search.set("shortlisted", "1");
  return request<{ results: Portrait[] }>(`/api/talent?${search.toString()}`);
}

export function toggleShortlist(userId: string, talentId: string) {
  return request<{ talentId: string; shortlisted: boolean; shortlists: number }>("/api/shortlists", {
    method: "POST",
    body: JSON.stringify({ userId, talentId }),
  });
}

export function fetchStudio(userId: string) {
  return request<{
    user: User;
    uploads: Upload[];
    completion: number;
    stats: { views: number; shortlists: number; licenses: number; earnings: number };
  }>(`/api/users/${userId}/studio`);
}

export function addStudioMedia(userId: string, payload: { data: string; mime: string; name: string }) {
  return request<{ media: Upload }>(`/api/users/${userId}/media`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteStudioMedia(userId: string, mediaId: number) {
  return request<{ media: Upload }>(`/api/users/${userId}/media/${mediaId}`, { method: "DELETE" });
}

export function setStudioPrimary(userId: string, mediaId: number) {
  return request<{ media: Upload }>(`/api/users/${userId}/media/${mediaId}/primary`, { method: "POST" });
}

export function fetchAdminTalent(userId: string) {
  return request<{ results: Portrait[] }>(`/api/admin/talent?userId=${encodeURIComponent(userId)}`);
}

export function fetchAdminTalentDetail(userId: string, talentId: string) {
  return request<{ talent: Portrait; uploads: Upload[] }>(
    `/api/admin/talent/${encodeURIComponent(talentId)}?userId=${encodeURIComponent(userId)}`,
  );
}

export function fetchTalentDetail(talentId: string) {
  return request<{ talent: Portrait; uploads: Upload[] }>(`/api/talent/${encodeURIComponent(talentId)}`);
}

export function updateAdminTalent(userId: string, talentId: string, payload: { verified: boolean; agreedPrice: number }) {
  return request<{ talent: Portrait }>(`/api/admin/talent/${talentId}`, {
    method: "PATCH",
    body: JSON.stringify({ userId, ...payload }),
  });
}

export function createLicense(payload: Record<string, unknown>) {
  return request<{ license: { id: string; total: number } }>("/api/licenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
