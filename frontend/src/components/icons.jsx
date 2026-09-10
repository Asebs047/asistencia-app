const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconStudents(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
    </svg>
  );
}

export function IconTeacher(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

export function IconCoordinator(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 4 6v5c0 4.5 3.2 7.9 8 10 4.8-2.1 8-5.5 8-10V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconGroups(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15.5 14.2c2.6.4 4.5 2.5 4.5 5.3" />
    </svg>
  );
}

export function IconAttendance(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M8 2.5v3M16 2.5v3M8 12l2.5 2.5L16 9" />
    </svg>
  );
}

export function IconPermissions(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </svg>
  );
}

export function IconReports(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </svg>
  );
}

export function IconLogout(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconPercent(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 19 19 5" />
      <circle cx="6.5" cy="6.5" r="2.2" />
      <circle cx="17.5" cy="17.5" r="2.2" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
