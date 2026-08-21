// Reusable top-nav tabs — shared by every authenticated topbar so clicks
// actually navigate. In pages/* the hrefs resolve as siblings; on the canvas
// Kevin.html they fail gracefully.

const TopNavTabs = ({ active }) => {
  // Relative path that works whether the page is at /pages/XX.html or the canvas root.
  const link = (file) => {
    if (typeof window === 'undefined') return '#';
    const inPagesFolder = /\/pages\//.test(window.location.pathname);
    return inPagesFolder ? file : `pages/${file}`;
  };
  const TABS = [
    ['New claim',  '03-Intake.html'],
    ['My claims',  '01-My-claims.html'],
    ['Exports',    '13-Exports-history.html'],
    ['Settings',   '31-Settings-profile.html'],
  ];
  return (
    <nav style={{ display: 'flex', gap: 2, fontSize: 12.5 }}>
      {TABS.map(([label, file]) => (
        <a
          key={label}
          href={link(file)}
          className={`k-tab ${label === active ? 'k-tab--active' : ''}`}
        >
          {label}
        </a>
      ))}
    </nav>
  );
};

window.TopNavTabs = TopNavTabs;
