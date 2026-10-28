import { handleResponse } from "./apiHandle";

const getAuthToken = () => {
  return localStorage.getItem("access_token");
};

const apiService = async (
  endpoint,
  method = "GET",
  body = null,
  customHeaders = {},
  target = "cloud",
) => {
  // Resolve Cloud URL: Desktop Electron config -> Vite env -> Default
  const cloudUrl =
    window.kioskEnv?.getApiUrl?.() || import.meta.env.VITE_API_BASE_URL || "";

  // Resolve Local URL: Native/custom env -> fallback to localhost port (e.g. 8000 or 3000)
  const localUrl =
    window.kioskEnv?.getLocalApiUrl?.() ||
    import.meta.env.VITE_LOCAL_API_BASE_URL ||
    "http://localhost:8000";

  // Choose base URL according to target
  const baseUrl = target === "local" ? localUrl : cloudUrl;

  const url = `${baseUrl}${endpoint}`;

  const headers = { ...customHeaders };

  // 1. Attach Content-Type for JSON payloads
  if (body && !(body instanceof FormData) && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  // 2. Attach Authorization header dynamically if a token exists
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    // Parse JSON safely if returned, fallback to empty object if not
    let responseData = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    // Check if HTTP status is outside 200-299 range
    if (!response.ok) {
      const error = new Error(
        responseData?.msg ||
          responseData?.message ||
          `HTTP Error ${response.status}`,
      );
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    return handleResponse({
      status: response.status,
      data: responseData,
    });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default apiService;
