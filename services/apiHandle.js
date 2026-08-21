import { ErrorToast } from "../src/app/components/base/toast";

// Helper to extract error message from standard or FastAPI/Pydantic payloads
const extractErrorMessage = (data) => {
  if (!data) return "An unexpected error occurred.";
  
  // 1. FastAPI/Pydantic array error (e.g. [{ msg: '...', loc: [...] }])
  if (Array.isArray(data.detail)) {
    return data.detail.map((err) => err.msg).join(", ");
  }

  // 2. FastAPI string detail (e.g. { detail: 'Unauthorized' })
  if (typeof data.detail === "string") {
    return data.detail;
  }

  // 3. Custom backend format (e.g. { msg: '...' } or { message: '...' })
  if (data.msg) return data.msg;
  if (data.message) return data.message;

  return "An unexpected error occurred.";
};

export function handleResponse(response) {
  if (!response) {
    const fallbackMessage = "No response received from server.";
    ErrorToast(fallbackMessage);
    throw new Error(fallbackMessage);
  }

  const { status, data } = response;

  // 1. Handle all successful 2xx responses
  if (status >= 200 && status < 300) {
    return data;
  }

  // 2. Extract error message safely
  const message = extractErrorMessage(data);

  // 3. Handle specific error statuses
  switch (status) {
    case 400:
      // Bad Request (validation errors, malformed payload)
      ErrorToast(message || "Invalid request.");
      break;

    case 401:
      // Unauthorized (expired/missing token)
      ErrorToast(message || "Session expired. Please log in again.");
      // if (typeof window !== "undefined") {
      //   // Clear expired token if necessary: localStorage.removeItem("access_token");
      //   setTimeout(() => {
      //     window.location.href = "/login";
      //   }, 1200);
      // }
      break;

    case 403:
      // Forbidden (insufficient permissions)
      ErrorToast(message || "You do not have permission to perform this action.");
      break;

    case 404:
      ErrorToast(message || "Requested resource not found.");
      break;

    case 500:
    default:
      ErrorToast(message || "A server error occurred. Please try again later.");
      break;
  }

  throw new Error(message);
}