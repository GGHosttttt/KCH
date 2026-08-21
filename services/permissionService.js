export function setUserRules(data) {
  try {
    localStorage.setItem("user_rules", JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save user_rules to localStorage", error);
  }
}

export function getUserRules() {
  try {
    const raw = localStorage.getItem("user_rules");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.lists) ? parsed.lists : [];
  } catch (error) {
    console.error("Failed to parse user_rules from localStorage", error);
    return [];
  }
}

export function isPermission(route) {
  if (typeof window === "undefined") 
    return false;

  const rules = getUserRules();
  if (!Array.isArray(rules)) return false;

  function normalizeRoute(r) {
    return r.replace(/\/$/, "");
  }

  const normalizedRoute = normalizeRoute(route);

  const hasRoute = (items) => {
    for (const item of items) {
      if (!item.route) continue;
      if (normalizeRoute(item.route) === normalizedRoute) return true;
      if (Array.isArray(item.sub_menus)) {
        if (hasRoute(item.sub_menus)) return true;
      }
    }
    return false;
  };

  return hasRoute(rules);
}
