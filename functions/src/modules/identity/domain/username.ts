// Username policy (MUSER_DATABASE.md §3): lowercase, 3-20 chars, a-z 0-9 "_" ".",
// starting and ending with a letter or digit.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_.]*[a-z0-9])?$/;

// Handles that would impersonate the product or collide with routes/system names.
const RESERVED = new Set(["admin", "administrator", "muser", "support", "help", "root", "system", "official", "me", "null", "undefined"]);

export const isReservedUsername = (username: string) => RESERVED.has(username);
