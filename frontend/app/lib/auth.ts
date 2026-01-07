const PERMISSION_KEY = "permission_level";

const readCookie = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  if (!match) {
    return null;
  }
  return decodeURIComponent(match.split("=")[1] ?? "");
};

export const clearAuth = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(PERMISSION_KEY);
};

export const setPermission = (permissionLevel?: string) => {
  if (typeof window === "undefined") {
    return;
  }
  if (permissionLevel) {
    localStorage.setItem(PERMISSION_KEY, permissionLevel);
  }
};

export const getPermission = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(PERMISSION_KEY);
};

export const getCsrfToken = () => readCookie("csrf_token");
