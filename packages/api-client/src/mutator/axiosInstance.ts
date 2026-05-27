import axios, { type AxiosRequestConfig } from "axios";

// A single axios instance shared by all Orval-generated hooks.
// Set EXPO_PUBLIC_API_URL in your root .env to point at the backend.
// In dev: http://localhost:8787 (wrangler dev default).
const httpClient = axios.create({
  baseURL: process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:8787",
});

// This function signature is what Orval expects from a custom mutator.
// It wraps the axios call and unwraps AxiosResponse<T> → T so hooks
// receive the data directly, not the full response object.
export const axiosInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  httpClient(config).then(({ data }) => data);

export default axiosInstance;
