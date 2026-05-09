const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(input: string) {
  try {
    const date = new Date(input);
    if (isNaN(date.getTime())) return input || '—';
    return dateTimeFormatter.format(date);
  } catch {
    return input || '—';
  }
}
