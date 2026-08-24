/**
 * Parses a pasted or uploaded statsheet into rows the API can resolve.
 *
 * Deliberately delimiter-agnostic. Copying cells out of Google Sheets or Excel
 * puts *tab*-separated text on the clipboard, while a saved export is
 * comma-separated — so sniffing the delimiter is what lets one paste box accept
 * all three sources without asking the coach which one they used.
 *
 * Column mapping is by header name against a list of aliases, and the resolved
 * mapping is handed back so the UI can show it. A silent mis-map here would write
 * assists into the points column.
 */

/** Stat columns the API accepts, plus the row's identifier. */
export type SheetField = 'identifier' | 'ppg' | 'rpg' | 'apg' | 'fg_pct';

export type SheetRow = {
  identifier: string;
  ppg?: string;
  rpg?: string;
  apg?: string;
  fg_pct?: string;
};

export type ParsedSheet = {
  rows: SheetRow[];
  /** Which spreadsheet header ended up driving each field. */
  mapping: Partial<Record<SheetField, string>>;
  /** Headers we saw but had no use for — surfaced so nothing looks silently lost. */
  ignored: string[];
  delimiter: 'tab' | 'comma';
  /** Set when the sheet can't be used at all. */
  error?: string;
};

/**
 * Header aliases, matched after stripping everything but letters and digits — so
 * "FG%", "fg pct" and "Field Goal %" all collapse to the same key.
 */
const ALIASES: Record<SheetField, string[]> = {
  identifier: [
    'identifier',
    'email',
    'emailaddress',
    'playeremail',
    'jersey',
    'jerseyno',
    'jerseynumber',
    'number',
    'no',
    'num',
    'id',
    'player',
    'playerid',
  ],
  ppg: ['ppg', 'pts', 'points', 'pointspergame', 'ptspg', 'scoring'],
  rpg: ['rpg', 'reb', 'rebs', 'rebounds', 'trb', 'reboundspergame'],
  apg: ['apg', 'ast', 'assists', 'assistspergame'],
  fg_pct: ['fg', 'fgpct', 'fgpercent', 'fgpercentage', 'fieldgoal', 'fieldgoalpct', 'fieldgoals'],
};

const normalise = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function fieldForHeader(header: string): SheetField | null {
  const key = normalise(header);
  if (!key) return null;

  for (const [field, aliases] of Object.entries(ALIASES) as [SheetField, string[]][]) {
    if (aliases.includes(key)) return field;
  }
  return null;
}

/**
 * Splits one line, honouring double quotes so a quoted field containing the
 * delimiter ("Davis, Jordan") stays a single cell. Doubled quotes inside a quoted
 * field are an escaped quote, per the CSV convention spreadsheets emit.
 */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === delimiter && !quoted) {
      cells.push(cell);
      cell = '';
      continue;
    }

    cell += char;
  }

  cells.push(cell);
  return cells.map((value) => value.trim());
}

/** Tabs win when present: a clipboard paste from a spreadsheet is tab-separated. */
function sniffDelimiter(line: string): { char: string; name: 'tab' | 'comma' } {
  const tabs = (line.match(/\t/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return tabs >= commas && tabs > 0 ? { char: '\t', name: 'tab' } : { char: ',', name: 'comma' };
}

export function parseStatSheet(input: string): ParsedSheet {
  const empty: ParsedSheet = { rows: [], mapping: {}, ignored: [], delimiter: 'comma' };

  const lines = input
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { ...empty, error: 'Nothing to read — paste your sheet or choose a CSV file.' };
  }

  const { char, name } = sniffDelimiter(lines[0] ?? '');
  const headerCells = splitLine(lines[0] ?? '', char);

  const mapping: Partial<Record<SheetField, string>> = {};
  const columnForIndex: (SheetField | null)[] = [];
  const ignored: string[] = [];

  headerCells.forEach((header) => {
    const field = fieldForHeader(header);
    // First header wins for a field, so a sheet with both "PTS" and "PPG"
    // doesn't silently flip to whichever came last.
    if (field && !mapping[field]) {
      mapping[field] = header;
      columnForIndex.push(field);
    } else {
      if (header.length > 0) ignored.push(header);
      columnForIndex.push(null);
    }
  });

  if (!mapping.identifier) {
    return {
      ...empty,
      delimiter: name,
      ignored,
      error:
        'No email or jersey-number column found. Add a header row with a column called ' +
        '"Email" or "Jersey" so each row can be matched to a player.',
    };
  }

  const statFields = (['ppg', 'rpg', 'apg', 'fg_pct'] as const).filter((f) => mapping[f]);
  if (statFields.length === 0) {
    return {
      ...empty,
      delimiter: name,
      ignored,
      error:
        'No stat columns found. Include at least one of PPG, RPG, APG or FG% in the header row.',
    };
  }

  const rows: SheetRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitLine(line, char);
    const row: SheetRow = { identifier: '' };

    columnForIndex.forEach((field, index) => {
      if (!field) return;
      const value = cells[index] ?? '';
      if (field === 'identifier') row.identifier = value;
      else row[field] = value;
    });

    // A trailing blank line or a spreadsheet's empty filler row isn't an error.
    const hasAnything = row.identifier.length > 0 || statFields.some((f) => (row[f] ?? '') !== '');
    if (hasAnything) rows.push(row);
  }

  if (rows.length === 0) {
    return {
      ...empty,
      delimiter: name,
      mapping,
      ignored,
      error: 'Found a header row but no data rows underneath it.',
    };
  }

  return { rows, mapping, ignored, delimiter: name };
}

/** Human-readable label for a mapped field, for the mapping summary. */
export const FIELD_LABELS: Record<SheetField, string> = {
  identifier: 'Player (email or jersey)',
  ppg: 'Points per game',
  rpg: 'Rebounds per game',
  apg: 'Assists per game',
  fg_pct: 'Field goal %',
};

/** Example a coach can copy when their sheet has no headers. */
export const SAMPLE_SHEET = ['email,ppg,rpg,apg,fg', 'player@example.com,18.4,7.2,5.1,47%'].join(
  '\n'
);
