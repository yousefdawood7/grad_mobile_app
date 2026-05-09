const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(input: string) {
  return dateTimeFormatter.format(new Date(input));
}
