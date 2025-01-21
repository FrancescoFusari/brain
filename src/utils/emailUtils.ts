export const extractSenderName = (email: string) => {
  const nameMatch = email.match(/^([^<]+)</);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  return email.split('@')[0].split('.').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};