export const applyTheme = (isDark: boolean): void => {
  document.documentElement.classList.toggle('dark', isDark);
};
