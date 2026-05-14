export function parseCsv(text: string) {
    const rows: string[][] = [];
    let field = '';
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(field);
            field = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') i++;
            row.push(field);
            if (row.some(Boolean)) rows.push(row);
            field = '';
            row = [];
        } else {
            field += char;
        }
    }

    row.push(field);
    if (row.some(Boolean)) rows.push(row);
    return rows;
}

export function rowsToObjects(text: string) {
    const [headers, ...rows] = parseCsv(text);
    if (!headers) return [];

    return rows.map((row) =>
        headers.reduce<Record<string, string>>((acc, header, index) => {
            acc[header.trim()] = row[index]?.trim() ?? '';
            return acc;
        }, {})
    );
}
