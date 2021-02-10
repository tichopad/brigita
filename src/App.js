import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { equals, last, pipe, prop, split, toLower } from 'ramda';
import './App.css';
import handleCsv from './handleCsv';

// prettier-ignore
const fileIsCsv = pipe(
  prop('name'),
  split('.'),
  last,
  toLower,
  equals('csv')
);

const App = () => {
  const [range, setRange] = useState(3);
  const [limit, setLimit] = useState(38);
  const [results, setResults] = useState([]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      console.log({ acceptedFiles });
      const resultsWithMetaPromises = acceptedFiles.filter(fileIsCsv).map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onabort = () => reject('File reading was aborted');
          reader.onerror = () => reject('File reading has failed');
          reader.onload = () => {
            handleCsv(reader.result, range, limit).then((targets) => {
              resolve({ run: file.name, targets, range, limit });
            });
          };
          reader.readAsText(file);
        });
      });
      const resultsWithMetaPromise = Promise.all(resultsWithMetaPromises);
      resultsWithMetaPromise.then((resultsWithMeta) => setResults([...results, ...resultsWithMeta]));
    },
    [range, limit, results]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleInputChange = (setter) => (event) => setter(event.target.value);

  return (
    <div className="App">
      <h1>Brigita</h1>
      <h2>Controls</h2>
      <div className="App-controls">
        <label className="App-input-container">
          <span>Range</span>
          <input step="0.1" type="number" value={range} onChange={handleInputChange(setRange)} />
        </label>
        <label className="App-input-container">
          <span>Limit</span>
          <input step="0.1" type="number" value={limit} onChange={handleInputChange(setLimit)} />
        </label>
      </div>
      <div className="App-dropzone" {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some CSV files here, or click to select files</p>
        )}
      </div>
      <h2>Results</h2>
      <div className="App-results">
        {results.map((result, index) => (
          <div className="App-result" key={result.run + result.range + result.limit}>
            <p>
              <i>#{index + 1}</i>
            </p>
            <h3>{result.run}</h3>
            <h4>
              Range: {result.range}, limit: {result.limit}
            </h4>
            <table>
              <thead>
                <tr>
                  <th>Sample</th>
                  <th>Position</th>
                  <th>Cq (FAM)</th>
                  <th>Cq (HEX)</th>
                </tr>
              </thead>
              <tbody>
                {result.targets.map((target) => (
                  <tr key={target.HEX.Sample + target.HEX.Well}>
                    <td>{target.HEX.Sample}</td>
                    <td>
                      <strong>{target.HEX.Well}</strong>
                    </td>
                    <td>{target.FAM.Cq}</td>
                    <td>{target.HEX.Cq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
