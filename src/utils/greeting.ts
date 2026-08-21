export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}
