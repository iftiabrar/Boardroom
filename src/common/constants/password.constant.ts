// Strong password rule used by register and profile update.
// At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const STRONG_PASSWORD_MESSAGE =
  "password must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number and a symbol";
