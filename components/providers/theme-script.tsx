export function ThemeScript() {
  const script = `(() => {
    try {
      const stored = localStorage.getItem('infraos-theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored === 'light' || stored === 'dark' ? stored : (systemDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    } catch {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
