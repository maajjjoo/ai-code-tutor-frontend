import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = title ? `${title} — AICodeTutor` : 'AICodeTutor';
    return () => {
      document.title = 'AICodeTutor';
    };
  }, [title]);
};
