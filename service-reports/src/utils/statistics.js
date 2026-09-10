// Funciones puras (sin acceso a red/DB) para poder probarlas de forma aislada.

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseTimeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function getLateCutoffMinutes(entryTime, graceMinutes) {
  return parseTimeToMinutes(entryTime) + Number(graceMinutes);
}

// Marca cada entrada como puntual o tarde según la hora de entrada + margen.
export function computePunctuality(records, entryTime = "07:00", graceMinutes = 15) {
  const cutoff = getLateCutoffMinutes(entryTime, graceMinutes);

  const enriched = records.map((r) => {
    if (r.type !== "entrada") return { ...r, onTime: null };
    const onTime = minutesSinceMidnight(new Date(r.markedAt)) <= cutoff;
    return { ...r, onTime };
  });

  const entradas = enriched.filter((r) => r.type === "entrada");
  const onTimeCount = entradas.filter((r) => r.onTime).length;

  return {
    records: enriched,
    summary: {
      total: entradas.length,
      onTime: onTimeCount,
      late: entradas.length - onTimeCount,
      onTimeRate: entradas.length ? onTimeCount / entradas.length : null,
    },
  };
}

function toDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function lastNDateKeys(days) {
  const keys = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

// Un alumno activo sin `entrada` registrada en un día de la ventana cuenta como
// ausente ese día.
export function computeAbsences(students, records, days = 7) {
  const dateKeys = lastNDateKeys(days);
  const entradasByStudent = new Map();

  for (const r of records) {
    if (r.type !== "entrada") continue;
    const key = r.studentId.toString();
    if (!entradasByStudent.has(key)) entradasByStudent.set(key, new Set());
    entradasByStudent.get(key).add(toDateKey(r.markedAt));
  }

  const perStudent = students.map((student) => {
    const present = entradasByStudent.get(student._id.toString()) || new Set();
    const absentDates = dateKeys.filter((day) => !present.has(day));
    return {
      studentId: student._id,
      name: student.name,
      groupId: student.groupId,
      absences: absentDates.length,
      absentDates,
    };
  });

  return {
    days,
    students: perStudent,
    totalAbsences: perStudent.reduce((sum, s) => sum + s.absences, 0),
  };
}

// Cantidad, duración promedio y frecuencia (por semana) de permisos, agrupado por
// alumno y por grupo.
export function computePermissionStats(permissions) {
  function aggregate(keyFn) {
    const groups = new Map();
    for (const p of permissions) {
      const key = keyFn(p).toString();
      if (!groups.has(key)) groups.set(key, { key, count: 0, totalDurationMs: 0, finished: 0 });
      const bucket = groups.get(key);
      bucket.count += 1;
      if (p.status === "finalizado" && p.startedAt && p.finishedAt) {
        bucket.totalDurationMs += new Date(p.finishedAt) - new Date(p.startedAt);
        bucket.finished += 1;
      }
    }

    const dates = permissions.map((p) => new Date(p.requestedAt).getTime());
    const weeks = dates.length
      ? Math.max(1, (Math.max(...dates) - Math.min(...dates)) / (7 * 24 * 60 * 60 * 1000))
      : 1;

    return [...groups.values()].map((b) => ({
      ...b,
      avgDurationMs: b.finished ? b.totalDurationMs / b.finished : null,
      frequencyPerWeek: b.count / weeks,
    }));
  }

  return {
    byStudent: aggregate((p) => p.studentId),
    byGroup: aggregate((p) => p.groupId),
  };
}
