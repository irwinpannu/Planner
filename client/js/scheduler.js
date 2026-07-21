// Pure scheduling logic. Completed work is retained on each assignment, then the
// remaining work is planned again from the current moment whenever anything changes.
const priorityWeight = { high: 3, medium: 2, low: 1 };
const toMinutes = time => { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes; };
const at = (date, minute) => { const value = new Date(date); value.setHours(0, minute, 0, 0); return value; };

export function buildSchedule(assignments, availability, now = new Date()) {
  const active = assignments
    .filter(task => !task.completed)
    .map(task => ({ ...task, remaining: Math.max(0, task.duration - (task.completedMinutes || 0)) }))
    .filter(task => task.remaining > 0);
  const sessions = [];
  let sessionNumber = 0;
  const day = new Date(now); day.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 120; offset++) {
    const date = new Date(day); date.setDate(day.getDate() + offset);
    const window = availability[date.getDay()];
    if (!window?.enabled || window.start >= window.end) continue;

    // Never recreate sessions in elapsed time today.
    const currentMinute = offset === 0 ? now.getHours() * 60 + now.getMinutes() : 0;
    let slotCursor = Math.max(toMinutes(window.start), Math.ceil(currentMinute / 30) * 30);
    const slotEnd = toMinutes(window.end);

    while (slotCursor + 30 <= slotEnd) {
      const start = at(date, slotCursor);
      const candidates = active.filter(task => new Date(task.deadline) > start && task.remaining >= 30);
      if (!candidates.length) break;
      candidates.sort((left, right) => taskScore(right, start) - taskScore(left, start));
      const task = candidates[0];
      const deadline = new Date(task.deadline);
      const deadlineEnd = deadline.toDateString() === date.toDateString()
        ? Math.min(slotEnd, deadline.getHours() * 60 + deadline.getMinutes()) : slotEnd;
      const available = deadlineEnd - slotCursor;
      if (available < 30) { slotCursor = slotEnd; continue; }
      const workMinutes = Math.min(task.remaining, available, 120);
      sessions.push({
        id: `${task.id}-${date.getTime()}-${slotCursor}-${sessionNumber++}`, assignmentId: task.id, title: task.title, course: task.course,
        priority: task.priority, start: start.toISOString(), end: at(date, slotCursor + workMinutes).toISOString(), minutes: workMinutes
      });
      task.remaining -= workMinutes;
      slotCursor += workMinutes;
    }
  }
  return { sessions, overloaded: active.some(task => task.remaining > 0) };
}

function taskScore(task, start) {
  const hoursUntilDeadline = Math.max(0.1, (new Date(task.deadline) - start) / 3_600_000);
  // Deadline pressure dominates, then priority; a 45-minute assignment due in an
  // hour moves ahead of a lower-priority task due days later.
  const urgency = 20_000 / hoursUntilDeadline;
  const priority = (priorityWeight[task.priority] || 1) * 1_000;
  const longWorkBonus = Math.min(task.remaining / 60, 10) * 75;
  return urgency + priority + longWorkBonus;
}
