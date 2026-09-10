import { useState } from "react";

// tabs: [{ key, label, content }]
export default function Tabs({ tabs, initialKey }) {
  const [active, setActive] = useState(initialKey || tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active) || tabs[0];

  return (
    <div>
      <div className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            type="button"
            className={`tab-button${tab.key === active ? " active" : ""}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{activeTab?.content}</div>
    </div>
  );
}
