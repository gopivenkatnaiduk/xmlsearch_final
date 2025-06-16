import React, { useState } from "react";
import { XMLParser } from "fast-xml-parser";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./App.css";

function App() {
  const [xmlContent, setXmlContent] = useState("");
  const [searchTag, setSearchTag] = useState("AutoCalculated");
  const [searchValue, setSearchValue] = useState("true");
  const [fieldData, setFieldData] = useState([]);
  const [matchCount, setMatchCount] = useState(0); // NEW STATE to store count
  const [showResult, setShowResult] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      setXmlContent(event.target.result);
    };

    reader.readAsText(file);
  };

  const handleSearch = () => {
    if (!xmlContent) {
      alert("Please upload an XML file first.");
      return [];
    }

    if (!searchTag || !searchValue) {
      alert("Please enter both tag and value.");
      return [];
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
    });

    const jsonObj = parser.parse(xmlContent);
    let matchingData = [];

    const fieldNodes = jsonObj?.Fields?.Field
      ? Array.isArray(jsonObj.Fields.Field)
        ? jsonObj.Fields.Field
        : [jsonObj.Fields.Field]
      : [];

    fieldNodes.forEach((field) => {
      const code = field["@_Code"] ?? "";
      const autoCalculatedValue = field[searchTag] ?? "";
      const calculatedValue = field["Calculated"] ?? "";
      const formula = field?.Formula?.Expression ?? "";

      if (
        String(calculatedValue).toLowerCase() === "true" &&
        String(autoCalculatedValue).toLowerCase() === searchValue.toLowerCase()
      ) {
        matchingData.push({
          FieldCode: code,
          Formula: formula,
        });
      }
    });

    setMatchCount(matchingData.length); // SET COUNT HERE
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
    setShowResult(true); // only after export, show result
  };

  return (
    <div className="container">
      <div className="card">
        <h2>XML Tag & Value Search </h2>

        <div className="input-group">
          <label>Upload XML File</label>
          <input type="file" accept=".xml" onChange={handleFileUpload} />
        </div>

        <div className="input-group">
          <label>Search Tag Name</label>
          <input
            type="text"
            placeholder="Enter tag name (e.g. AutoCalculated)"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Search Tag Value</label>
          <input
            type="text"
            placeholder="Enter value (true/false/etc)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* <div className="input-group">
          <button onClick={handleSearchAndExport}>Export to Excel</button>
        </div> */}
        <div
          className="input-group"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <button onClick={handleSearchAndExport}>Export to Excel</button>
        </div>

        {/* Display Count */}
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
