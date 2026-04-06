export function parseHumanDate(value: string): string | undefined {
  const match = value.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) {
    return undefined;
  }

  const dayText = match[1];
  const monthText = match[2];
  const yearText = match[3];

  if (!dayText || !monthText || !yearText) {
    return undefined;
  }
  const monthLookup = new Map([
    ["january", "01"],
    ["february", "02"],
    ["march", "03"],
    ["april", "04"],
    ["may", "05"],
    ["june", "06"],
    ["july", "07"],
    ["august", "08"],
    ["september", "09"],
    ["october", "10"],
    ["november", "11"],
    ["december", "12"],
  ]);

  const month = monthLookup.get(monthText.toLowerCase());
  if (!month) {
    return undefined;
  }

  return `${yearText}-${month}-${dayText.padStart(2, "0")}`;
}
