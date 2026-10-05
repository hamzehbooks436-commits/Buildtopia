// Firebase UID of the account provisioned in Authentication. Never trust a name,
// a profile field, a URL flag, or localStorage for administrator privileges.
export const ADMIN_UID = "qSv2Mg9XCEQmr1ymQe6BQ4cZi9Z2";
export function isAdminAccount(user, localMode = false) {
  return !localMode && user?.uid === ADMIN_UID;
}
