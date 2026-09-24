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

export function requestSignupOtp(payload: { channel?: "email"; email: string }) {
  return request<{ channel: string; target: string; sent: boolean; delivered: boolean; devOtp?: string }>("/api/signup/otp", {
    method: "POST",
    body: JSON.stringify({ channel: "email", ...payload }),
  });
}

export function verifySignupOtp(payload: { channel?: "email"; email: string; code: string }) {
  return request<{ channel: string; verified: boolean }>("/api/signup/verify", {
    method: "POST",
    body: JSON.stringify({ channel: "email", ...payload }),
  });
}

export function verifyUser(userId: string, field: "email" | "identity") {
  return request<{ user: User }>("/api/verify", {
    method: "POST",
    body: JSON.stringify({ userId, field }),
  });
}

export function completeProfile(userId: string, payload: Record<string, unknown>) {
  return request<{ user: User }>(`/api/users/${userId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchTalent(params: { query: string; gender: string; categories: string[]; ages: string[] }) {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.gender) search.set("gender", params.gender);
  if (params.categories.length) search.set("categories", params.categories.join(","));
  if (params.ages.length) search.set("ages", params.ages.join(","));
  return request<{ results: Portrait[] }>(`/api/talent?${search.toString()}`);
}

export function fetchStudio(userId: string) {
  return request<{
    user: User;
    uploads: Upload[];
    completion: number;
    stats: { views: number; shortlists: number; licenses: number; earnings: number };
  }>(`/api/users/${userId}/studio`);
}

export function addStudioMedia(userId: string) {
  return request<{ media: Upload }>(`/api/users/${userId}/media`, { method: "POST" });
}

export function deleteStudioMedia(userId: string, mediaId: number) {
  return request<{ media: Upload }>(`/api/users/${userId}/media/${mediaId}`, { method: "DELETE" });
}

export function fetchAdminTalent(userId: string) {
  return request<{ results: Portrait[] }>(`/api/admin/talent?userId=${encodeURIComponent(userId)}`);
}

export function updateAdminTalent(userId: string, talentId: string, payload: { verified: boolean; agreedPrice: number; processingFee: number }) {
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
