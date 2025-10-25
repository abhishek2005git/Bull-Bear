/**
 * Format today's date in a readable format
 * @returns Formatted date string (e.g., "Friday, January 24, 2025")
 */
export function formatDateToday(): string {
  const today = new Date();
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return today.toLocaleDateString('en-US', options);
}

/**
 * Format a date object
 * @param date - Date object to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('en-US', options);
}
