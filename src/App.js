import React, { useState } from "react";
import { XMLParser } from "fast-xml-parser";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./App.css";

function App() {
  const [xmlContent, setXmlContent] = useState("");
  const [searchInputs, setSearchInputs] = useState([""]);
  const [fieldData, setFieldData] = useState([]);
  const [matchCount, setMatchCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => setXmlContent(event.target.result);
    reader.readAsText(file);
  };
//handlesearch
  const handleSearch = () => {
    if (!xmlContent) {
      alert("Please upload an XML file first.");
      return [];
    }

    const parser = new XMLParser({ ignoreAttributes: false });
    const jsonObj = parser.parse(xmlContent);

    let fieldNodes = jsonObj?.Fields?.Field ?? [];
    if (!Array.isArray(fieldNodes)) {
      fieldNodes = [fieldNodes];
    }

    const parsedConditions = searchInputs
      .map((input) => {
        if (!input.includes(":")) return null;
        const [tag, value] = input.split(":").map((str) => str.trim());
        return { tag, value };
      })
      .filter((cond) => cond !== null);

    const matchingData = fieldNodes
      .filter((field) => {
        return parsedConditions.every(({ tag, value }) => {
          const fieldTagValue = field[tag] ?? "";
          return String(fieldTagValue).toLowerCase() === value.toLowerCase();
        });
      })
      .map((field) => {
        const result = {
          FieldCode: field["@_Code"] ?? "",
          Formula: field?.Formula?.Expression ?? "",
        };
        parsedConditions.forEach(({ tag }) => {
          result[tag] = String(field[tag] ?? "").toUpperCase();
        });
        return result;
      });

    setMatchCount(matchingData.length);
    setFieldData(matchingData);
    return matchingData;
  };

  const handleExportToExcel = (data) => {
    if (data.length === 0) {
      alert("No data to export.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MatchingFields");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blobData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blobData, "matching_fields.xlsx");
  };

  const handleSearchAndExport = () => {
    const result = handleSearch();
    handleExportToExcel(result);
    setShowResult(true);
  };

  const addSearchInput = () => {
    setSearchInputs([...searchInputs, ""]);
  };

  const removeSearchInput = (index) => {
    const newInputs = [...searchInputs];
    newInputs.splice(index, 1);
    setSearchInputs(newInputs);
  };

  const updateSearchInput = (index, value) => {
    const newInputs = [...searchInputs];
    newInputs[index] = value;
    setSearchInputs(newInputs);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>XML Tag & Value Search</h2>

        <div className="input-group">
          <label>Upload XML File</label>
          <input type="file" accept=".xml" onChange={handleFileUpload} />
        </div>

        {searchInputs.map((input, index) => (
          <div
            key={index}
            className="input-group"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <input
              type="text"
              placeholder={
                index === 0 ? "Tag:Value (e.g. AutoCalculated:true)" : ""
              }
              value={input}
              onChange={(e) => updateSearchInput(index, e.target.value)}
            />
            {index === 0 && <button onClick={addSearchInput}>+</button>}
            {searchInputs.length > 1 && (
              <button onClick={() => removeSearchInput(index)}>-</button>
            )}
          </div>
        ))}

        <div
          className="input-group"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <button onClick={handleSearchAndExport}>Export to Excel</button>
        </div>

        {showResult && (
          <div className="result">
            <h3>Result: {matchCount}</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
