export const generateInvestigationId = (): string => {
  const numericPart = Math.floor(100000 + Math.random() * 900000);
  const firstLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const secondLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `INVSTID-${numericPart}${firstLetter}${secondLetter}`;
};
