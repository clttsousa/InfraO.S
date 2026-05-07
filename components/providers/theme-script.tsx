export function ThemeScript() {
  const script = `(() => {
    try {
      const stored = localStorage.getItem('infraos-theme');
      const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
