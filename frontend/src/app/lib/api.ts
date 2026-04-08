"use client";
import { getSession, signIn } from "next-auth/react";
import { ApiResponse } from "@/types/api";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BASE_URL_WALLET =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4002";
const BASE_URL_GAME =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4002";

const apiFactory = (service?: Service): AxiosInstance => {
  const baseUrl: Record<Service, string> = {
    game: `${BASE_URL_WALLET}`,
    wallet: `${BASE_URL_GAME}`,
    kong_proxy: `${BASE_URL}`,
  };

  const api = axios.create({
    baseURL: baseUrl[service || "kong_proxy"],
    timeout: 30 * 1000,
  });

  api.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await signIn("keycloak", { prompt: "login" });
      }
      return Promise.reject(error);
    },
  );

  return api;
};

type Service = "kong_proxy" | "game" | "wallet";

export async function apiFetch<T>(
  service: Service = "kong_proxy",
  path: string,
  options?: AxiosRequestConfig,
): Promise<{ response: ApiResponse<T>; status: number }> {
  const api = apiFactory(service);
  const { status, data } = await api(path, options);

  return {
    response: data as ApiResponse<T>,
    status,
  };
}
