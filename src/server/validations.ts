export const validateEmailOrUsername = (value: string): string | undefined => {
  if (!value) return "Email or username is required";
  if (value.includes("@")) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Invalid email format";
  } else {
    if (value.length < 3) return "Username must be at least 3 characters";
  }
  return undefined;
};

export const validateLoginPassword = (value: string): string | undefined => {
  if (!value) return "Password is required";
  if (value.length < 6) return "Password must be at least 6 characters";
  return undefined;
};