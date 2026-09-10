import { useState } from "react";

// items: [{ key, label, icon: Component, content }]
export default function Sidebar({ items, initialKey }) {
  const [active, setActive] = useState(initialKey || items[0]?.key);
  const activeItem = items.find((i) => i.key === active) || items[0];

  return (
    <div className="app-shell">
      <nav className="app-sidebar">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={`app-sidebar-item${item.key === active ? " active" : ""}`}
              onClick={() => setActive(item.key)}
            >
              {Icon && <Icon />}
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="app-content">{activeItem?.content}</div>
    </div>
  );
}
