const fs = require('fs');
const Papa = require('papaparse');

const fileContent = fs.readFileSync('공공데이터활용지원센터_공공데이터포털 목록개방현황_20260331.csv', 'utf8');

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    const output = [];
    results.data.forEach(row => {
      if (!row['목록명']) return;
      
      let type = row['목록유형'];
      if (row['표준데이터여부'] === 'Y') {
        type = 'STD';
      }

      output.push({
        '목록명': row['목록명'],
        '파일데이터명': row['파일데이터명'],
        '키워드': row['키워드'],
        '제공기관': row['제공기관'],
        '분류체계': row['분류체계'],
        '목록유형': type,
        '확장자(데이터포맷)': row['확장자(데이터포맷)'],
        '설명': row['설명'],
        '수정일': row['수정일'],
        '조회수': row['조회수'],
        '다운로드수': row['다운로드_활용신청건수'],
        '비용유무': row['비용부과유무'],
        '목록 URL': row['목록 URL']
      });
    });

    fs.writeFileSync('public/data_full.json', JSON.stringify(output));
    console.log('Successfully processed ' + output.length + ' rows.');
  }
});
