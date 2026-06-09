const fs = require('fs');
const readline = require('readline');

async function processCSV() {
  const fileStream = fs.createReadStream('공공데이터활용지원센터_공공데이터포털 목록개방현황_20260331.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const output = [];
  let headers = [];
  let isFirstLine = true;

  // We need to handle CSV parsing. Since the file is large, we do it line by line.
  // Note: Papa parse for Node is better, but since we don't have it installed globally,
  // we can just use a simple regex for CSV parsing (handling quotes).
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  for await (const line of rl) {
    const values = parseCSVLine(line);
    
    if (isFirstLine) {
      headers = values;
      isFirstLine = false;
      continue;
    }

    if (values.length < headers.length) {
      // Malformed or multiline. For simplicity, we might skip or append,
      // but let's assume valid rows for now.
      continue;
    }

    const row = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i];
    }

    // Only pick what we need to keep file size small
    output.push({
      '목록명': row['목록명'],
      '제공기관': row['제공기관'],
      '분류체계': row['분류체계'],
      '목록유형': row['목록유형'] === '표준' ? 'STD' : row['목록유형'], // map if needed
      '확장자(데이터포맷)': row['확장자(데이터포맷)'],
      '설명': row['설명'],
      '수정일': row['수정일'],
      '조회수': row['조회수'],
      '다운로드수': row['다운로드_활용신청건수'],
      '비용유무': row['비용부과유무'],
      '목록 URL': row['목록 URL']
    });
  }

  fs.writeFileSync('public/data_full.json', JSON.stringify(output));
  console.log('Successfully processed ' + output.length + ' rows.');
}

processCSV();
