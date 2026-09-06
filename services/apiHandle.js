import { ErrorToast } from "../src/app/components/base/toast";

const extractErrorMessage = (data) => {
  if (!data) return "An unexpected error occurred.";

  if (Array.isArray(data.detail)) {
    return data.detail.map((err) => err.msg).join(", ");
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

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

  // Derive the effective status code (checks backend custom code first, then HTTP status)
  const statusCode = data?.code || status;

  // 1. Check if both HTTP status and payload code are successful
  const isHttpOk = status >= 200 && status < 300;
  const isBusinessOk = !data?.code || (data.code >= 200 && data.code < 300);

  if (isHttpOk && isBusinessOk) {
    return data;
  }

  // 2. Extract error message safely
  const message = extractErrorMessage(data);

  // 3. Handle specific error statuses (using statusCode)
  switch (statusCode) {
    case 400:
      ErrorToast(message || "Invalid request.");
      break;

    case 401:
      ErrorToast(message || "Session expired. Please log in again.");
      break;

    case 403:
      ErrorToast(message || "You do not have permission to perform this action.");
      break;

    case 404:
      ErrorToast(message || "Requested resource not found.");
      break;

    case 409:
      // Conflict (e.g., user_already_exists)
      ErrorToast(
        message === "user_already_exists"
          ? "គណនីនេះមានរួចហើយ (User already exists)"
          : message || "Conflict occurred."
      );
      break;

    case 500:
    default:
      ErrorToast(message || "A server error occurred. Please try again later.");
      break;
  }

  // Throw error to trigger the catch block in handleRegister
  throw new Error(message);
}