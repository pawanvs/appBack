function parseTowbookData(rawText) {
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headerLine = lines[0];
  const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);

  const dataRows = lines.slice(1);

  const result = dataRows.map(line => {
    const values = line.split('|').map(v => v.trim());
    const entry = {};

    for (let i = 0; i < headers.length; i++) {
      let fieldName = headers[i];
      let fieldValue = values[i] || null;

      // ✅ Clean up Call # field to remove leading #
      if (fieldName === 'Call #' && typeof fieldValue === 'string') {
        fieldValue = fieldValue.replace(/^#/, '');
      }

      entry[fieldName] = fieldValue;
    }

    return entry;
  });

  return result;
}

module.exports = { parseTowbookData };
