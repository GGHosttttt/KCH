"use client";
import { useEffect, useState } from "react";
import { isPermission } from "./permissionService"; 
export function PermissionGuard({ rule, children }) {
  const [hasPermission, setHasPermission] = useState(false);
  useEffect(() => {
    setHasPermission(isPermission(rule));
  }, [rule]);
  if (!hasPermission) return null;
  return <>{children}</>;
}