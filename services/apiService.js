import { handleResponse } from "./apiHandle";

// Helper to retrieve the active token (from memory, storage, or auth context)
const getAuthToken = () => {
  return localStorage.getItem("access_token");
};

const apiService = async (
  endpoint,
  method = "GET",
  body = null,
  customHeaders = {},
) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    ...customHeaders,
  };

  // 1. Attach Content-Type for JSON payloads
  if (body && !(body instanceof FormData) && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  // 2. Attach Authorization header dynamically if a token exists
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(token)
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
    const responseData = await response.json();
    console.log(responseData);
    // const contentType = response.headers.get("Content-Type");
    // if (contentType && contentType.includes("application/json")) {
    //   responseData = await response.json();
    //   console.log("API Response:", responseData);
    // } else if (
    //   contentType &&
    //   contentType.includes("application/octet-stream")
    // ) {
    //   responseData = await response.blob(); // Handle binary file
    //   console.log("Binary file received:", responseData);
    // } else {
    //   responseData = await response.text();
    // }
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
