export const encodePassword = (password: string): string => {
  return btoa(unescape(encodeURIComponent(password)));
};
