const TOKEN_KEY = 'token';
const TIME_KEY = 'time';  // Using "time"
const USERNAME_KEY = 'username';
const USER_ID_KEY = 'userId';
const USER_RULE_KEY = 'user_rules'; // Key for user rules
export const TokenService = {
  // Set the token in localStorage with timestamp and username (no encryption)
  setToken(token, username) {
    // Get current date and time in the format YYYY-MM-DD H:M:S
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // Format: YYYY-MM-DD H:M:S
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TIME_KEY, formattedTime);
    localStorage.setItem(USERNAME_KEY, username);
  },

  // Get the token from localStorage (plain text)
  getToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    const time = localStorage.getItem(TIME_KEY);
    const username = localStorage.getItem(USERNAME_KEY);

    if (!token || !time || !username) return null;
    return token;
  },

  // Get the time when the token was set
  getTime() {
    const time = localStorage.getItem(TIME_KEY);
    return time || null;
  },

  // Remove token and related data
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TIME_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(USER_RULE_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },

  // Set user ID in localStorage
  setUserId(userId) {
    localStorage.setItem(USER_ID_KEY, userId);
  },

  // Get user ID from localStorage
  getUserId() {
    const userId = localStorage.getItem(USER_ID_KEY);
    return userId || null;
  },
};
