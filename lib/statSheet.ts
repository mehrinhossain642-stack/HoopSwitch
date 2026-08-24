/**
 * Parses a pasted or uploaded box score into rows the API can resolve.
 *
 * Deliberately delimiter-agnostic. Copying cells out of Google Sheets or Excel
 * puts *tab*-separated text on the clipboard, while a saved export is
 * comma-separated — so sniffing the delimiter is what lets one paste box accept
 * all three sources without asking the coach which one they used.
 *
 * This is a single game's box score, not season averages: PPG/RPG/APG/FG% are
 * derived server-side from approved games, so counting stats are what get typed.
 */

export type SheetField =
  | 'identifier'
  | 'minutes'
  | 'fgm'
  | 'fga'
  | 'tpm'
  | 'tpa'
  | 'ftm'
  | 'fta'
  | 'reb'
  | 'ast'
  | 'stl'
  | 'blk'
  | 'tov'
  | 'pts';

export type SheetRow = Partial<Record<SheetField, string>> & { identifier: string };

export type ParsedSheet = {
  rows: SheetRow[];
  mapping: Partial<Record<SheetField, string>>;
  /** Headers we saw but had no use for — surfaced so nothing looks silently lost. */
  ignored: string[];
  delimiter: 'tab' | 'comma';
  error?: string;
};

/**
 * Header aliases, matched after stripping everything but letters and digits — so
 * "FGM", "fg made" and "FG-M" all collapse to the same key.
 *
 * Combined `8-15` style cells are split before mapping (see `splitCombined`), so
 * a sheet can carry either `FGM`/`FGA` columns or a single `FG` column.
 */
const ALIASES: Record<SheetField, string[]> = {
  identifier: [
    'identifier', 'email', 'emailaddress', 'playeremail', 'player', 'playerid',
    'jersey', 'jerseyno', 'jerseynumber', 'number', 'no', 'num', 'id',
  ],
  minutes: ['min', 'mins', 'minutes', 'mp'],
  fgm: ['fgm', 'fgmade', 'fieldgoalsmade'],
  fga: ['fga', 'fgatt', 'fgattempts', 'fieldgoalsattempted'],
  tpm: ['tpm', '3pm', '3ptm', 'threepm', 'threesmade', '3made'],
  tpa: ['tpa', '3pa', '3pta', 'threepa', 'threesattempted', '3att'],
  ftm: ['ftm', 'ftmade', 'freethrowsmade'],
  fta: ['fta', 'ftatt', 'freethrowsattempted'],
  reb: ['reb', 'rebs', 'rebounds', 'trb', 'totreb'],
  ast: ['ast', 'assists', 'asts'],
  stl: ['stl', 'steals', 'stls'],
  blk: ['blk', 'blocks', 'blks'],
  tov: ['tov', 'to', 'turnovers', 'turnover', 'tos'],
  pts: ['pts', 'points', 'pt', 'score', 'scoring'],
};

/**
 * Columns that a spreadsheet often writes as one `made-attempted` cell. Mapping
 * the pair lets a sheet with an `FG` column of `8-15` work as well as one with
 * separate `FGM`/`FGA` columns.
 */
const COMBINED: Record<string, [SheetField, SheetField]> = {
  fg: ['fgm', 'fga'],
  fieldgoals: ['fgm', 'fga'],
  '3p': ['tpm', 'tpa'],
  '3pt': ['tpm', 'tpa'],
  threes: ['tpm', 'tpa'],
  ft: ['ftm', 'fta'],
  freethrows: ['ftm', 'fta'],
};

const normalise = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

type Column = { field: SheetField } | { pair: [SheetField, SheetField] } | null;

function columnFor(header: string): Column {
  const key = normalise(header);
  if (!key) return null;

  for (const [field, aliases] of Object.entries(ALIASES) as [SheetField, string[]][]) {
    if (aliases.includes(key)) return { field };
  }
  if (COMBINED[key]) return { pair: COMBINED[key] };
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

/** `8-15` or `8/15` → ['8', '15']. Anything else yields the value and nothing. */
function splitCombined(value: string): [string, string] {
  const match = value.match(/^(\d+)\s*[-/]\s*(\d+)$/);
  return match ? [match[1] ?? '', match[2] ?? ''] : [value, ''];
}

export function parseStatSheet(input: string): ParsedSheet {
  const empty: ParsedSheet = { rows: [], mapping: {}, ignored: [], delimiter: 'comma' };

  const lines = input
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { ...empty, error: 'Nothing to read — paste the box score or choose a CSV file.' };
  }

  const { char, name } = sniffDelimiter(lines[0] ?? '');
  const headerCells = splitLine(lines[0] ?? '', char);

  const mapping: Partial<Record<SheetField, string>> = {};
  const columns: Column[] = [];
  const ignored: string[] = [];

  headerCells.forEach((header) => {
    const column = columnFor(header);

    if (column && 'field' in column && !mapping[column.field]) {
      mapping[column.field] = header;
      columns.push(column);
      return;
    }
    if (column && 'pair' in column && !mapping[column.pair[0]]) {
      mapping[column.pair[0]] = `${header} (made)`;
      mapping[column.pair[1]] = `${header} (att)`;
      columns.push(column);
      return;
    }

    if (header.length > 0) ignored.push(header);
    columns.push(null);
  });

  if (!mapping.identifier) {
    return {
      ...empty,
      delimiter: name,
      ignored,
      error:
        'No email or jersey-number column found. Add a header row with a column called ' +
        '"Email" or "Jersey" so each line can be matched to a player.',
    };
  }

  const statFields = (Object.keys(mapping) as SheetField[]).filter((f) => f !== 'identifier');
  if (statFields.length === 0) {
    return {
      ...empty,
      delimiter: name,
      ignored,
      error:
        'No box score columns found. Include at least one of PTS, REB, AST, MIN, FG, 3P or FT.',
    };
  }

  const rows: SheetRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitLine(line, char);
    const row: SheetRow = { identifier: '' };

    columns.forEach((column, index) => {
      if (!column) return;
      const value = cells[index] ?? '';

      if ('field' in column) {
        if (column.field === 'identifier') row.identifier = value;
        else row[column.field] = value;
        return;
      }

      const [made, attempted] = splitCombined(value);
      row[column.pair[0]] = made;
      row[column.pair[1]] = attempted;
    });

    const hasAnything =
      row.identifier.length > 0 || statFields.some((f) => (row[f] ?? '') !== '');
    if (hasAnything) rows.push(row);
  }

  if (rows.length === 0) {
    return {
      ...empty,
      delimiter: name,
      mapping,
      ignored,
      error: 'Found a header row but no player lines underneath it.',
    };
  }

  return { rows, mapping, ignored, delimiter: name };
}

export const FIELD_LABELS: Record<SheetField, string> = {
  identifier: 'Player (email or jersey)',
  minutes: 'Minutes',
  fgm: 'FG made',
  fga: 'FG attempted',
  tpm: '3PT made',
  tpa: '3PT attempted',
  ftm: 'FT made',
  fta: 'FT attempted',
  reb: 'Rebounds',
  ast: 'Assists',
  stl: 'Steals',
  blk: 'Blocks',
  tov: 'Turnovers',
  pts: 'Points',
};

/** Example a coach can copy when their sheet has no headers. */
export const SAMPLE_SHEET = [
  'email,min,fgm,fga,3pm,3pa,ftm,fta,reb,ast,stl,blk,to,pts',
  'player@example.com,32,8,15,2,5,3,4,6,7,2,0,3,21',
].join('\n');
