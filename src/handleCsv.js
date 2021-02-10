import * as csv from '@fast-csv/parse';
import { filter, groupBy, indexBy, map, omit, pathEq, pipe, prop, reject, values } from 'ramda';

const findTargets = (range, limit) => {
  return pipe(
    groupBy(prop('Sample')),
    map(indexBy(prop('Fluor'))),
    reject(pathEq(['FAM', 'Cq'], 'NaN')),
    omit(['NC', 'PC']),
    reject((row) => parseFloat(row.FAM.Cq) >= limit || parseFloat(row.HEX.Cq) >= limit),
    filter((row) => Math.abs(parseFloat(row.FAM.Cq) - parseFloat(row.HEX.Cq)) >= range),
    values
  );
};

const parseCsv = (csvString) => {
  let rows = [];

  const parseStream = csv.parseString(csvString, { headers: true });

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
