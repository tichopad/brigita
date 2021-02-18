import * as csv from '@fast-csv/parse';
import {
  always,
  filter,
  groupBy,
  ifElse,
  indexBy,
  indexOf,
  lt,
  map,
  nth,
  omit,
  pathEq,
  pipe,
  prop,
  reduce,
  reject,
  values,
  __,
} from 'ramda';

/**
 * @param {number} range
 * @param {number} limit
 */
const findTargets = (range, limit) => {
  return pipe(
    groupBy(prop('Sample')),
    map(indexBy(prop('Fluor'))),
    reject(pathEq(['FAM', 'Cq'], 'NaN')),
    omit(['NC', 'PC']),
    reject(({ FAM, HEX }) => parseFloat(FAM.Cq) >= limit || parseFloat(HEX.Cq) >= limit),
    filter(({ FAM, HEX }) => Math.abs(parseFloat(FAM.Cq) - parseFloat(HEX.Cq)) >= range),
    values
  );
};

/** @param {string} csvString */
const detectDelimiter = (csvString) => {
  const separators = [',', ';', '|', '\t'];
  const isNegative = lt(__, 0);
  const characterAtIndex = nth(__, csvString);
  const indexOfCharacter = indexOf(__, csvString);

  return pipe(
    map(indexOfCharacter),
    reduce((previous, current) => {
      return previous === -1 || (current !== -1 && current < previous) ? current : previous;
    }, -1),
    ifElse(isNegative, always(','), characterAtIndex)
  )(separators);
};

/** @param {string} csvString */
const parseCsv = (csvString) => {
  let rows = [];

  const csvStringSnippet = csvString.slice(0, 100);
  const delimiter = detectDelimiter(csvStringSnippet);
  const parseStream = csv.parseString(csvString, {
    delimiter,
    discardUnmappedColumns: true,
    headers: true,
  });

  return new Promise((resolve, reject) => {
    parseStream
      .on('error', reject)
      .on('end', () => resolve(rows))
      .on('data', (row) => rows.push(row));
  });
};

const handleCsv = async (fileContents, range, limit) => {
  const rows = await parseCsv(fileContents);
  const findTargetsWithinLimits = findTargets(parseFloat(range), parseFloat(limit));
  const targets = findTargetsWithinLimits(rows);

  return targets;
};

export default handleCsv;
