const getUserId = (): string => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'anonymous';
    const user = JSON.parse(raw);
    return String(user.id || 'anonymous');
  } catch {
    return 'anonymous';
  }
};

export const storage = {
  get: (key: string): string | null => {
    const userId = getUserId();
    return localStorage.getItem(`user_${userId}_${key}`);
  },

  set: (key: string, value: string): void => {
    const userId = getUserId();
    localStorage.setItem(`user_${userId}_${key}`, value);
  },

  remove: (key: string): void => {
    const userId = getUserId();
    localStorage.removeItem(`user_${userId}_${key}`);
  },

  clearUser: (): void => {
    const userId = getUserId();
    const prefix = `user_${userId}_`;
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k));
  },

  clearAll: (): void => {
    localStorage.clear();
  },
};
