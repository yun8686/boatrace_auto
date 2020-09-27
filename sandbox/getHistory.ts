// http://www.orangebuoy.net/odds/
// こちらのページの２分前オッズを取得
// 実行コマンド
// yarn ts-node sandbox/getHistory.ts
import puppeteer, { Page, Response } from "puppeteer";
import { Ren } from "../scraping/teleboat/types";
import stringify from "csv-stringify";
import iconv from "iconv-lite";
import fs from "fs";
import path from "path";
import { sleep } from "../scraping/teleboat/common";

(async () => {
  const page = await getBrowserPage({ headless: true });
  await page.goto("http://www.orangebuoy.net/odds/");
  // 場所の処理
  type JyoMaster = {
    code: string;
    name: string;
  };

  const jyoData: JyoMaster[] = [
    { code: "01", name: "桐生" },
    { code: "02", name: "戸田" },
    { code: "03", name: "江戸川" },
    { code: "04", name: "平和島" },
    { code: "05", name: "多摩川" },
    { code: "06", name: "浜名湖" },
    { code: "07", name: "蒲郡" },
    { code: "08", name: "常滑" },
    { code: "09", name: "津" },
    { code: "10", name: "三国" },
    { code: "11", name: "びわこ" },
    { code: "12", name: "住之江" },
    { code: "13", name: "尼崎" },
    { code: "14", name: "鳴門" },
    { code: "15", name: "丸亀" },
    { code: "16", name: "児島" },
    { code: "17", name: "宮島" },
    { code: "18", name: "徳山" },
    { code: "19", name: "下関" },
    { code: "20", name: "若松" },
    { code: "21", name: "芦屋" },
    { code: "22", name: "福岡" },
    { code: "23", name: "唐津" },
    { code: "24", name: "大村" },
  ];

  // 年のループ処理
  let startDate = new Date(2020, 3, 10);
  let today = new Date();
  while (startDate.getMonth() < today.getMonth()) {
    const day = startDate.getDate();
    const month = startDate.getMonth() + 1;
    const year = startDate.getFullYear();

    // アクセスが多いとエラーになるため、jyoCodeとjyoNameは会場を絞って対応
    // for (let joyNum = 0; joyNum < jyoData.length; joyNum++) {
    // const jyoCode = jyoData[joyNum].code;
    // const jyoName = jyoData[joyNum].name;
    const jyoCode = jyoData[0].code;
    const jyoName = jyoData[0].name;
    for (let raceNo = 1; raceNo <= 12; raceNo++) {
      await sleep(200);
      await page.goto(`http://www.orangebuoy.net/odds/?day=${day}&month=${month}&year=${year}&jyo=${jyoCode}&r=${raceNo}&mode=1`);

      // レース情報ない場合
      const errorCheck = await page.evaluate(() => {
        return document.querySelectorAll(".oddstable").length <= 0;
      });
      // 値の取得処理
      // | racedate   | jyoCode | raceNo | rank | kumiban | odds   |
      type ResultData = {
        racedate: string;
        jyoCode: string;
        raceNo: string;
        rank: string;
        kumiban: Ren[];
        odds: Ren[];
      };
      let resultData: ResultData[];
      const date = `${year}-${month}-${day}`;
      if (errorCheck) {
        console.log(date);
        continue;
      }

      resultData = await page.evaluate(
        (date, jyoCode, raceNo) => {
          const arr = [];
          for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
              if (i != j)
                for (let k = 1; k <= 6; k++) {
                  if (i != k && j != k) arr.push([i, j, k]);
                }
            }
          }
          const boat_number = [];
          for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 6; j++) boat_number.push(arr[i + j * 20]);
          }
          const oddsList = [];
          const tr = document.querySelector(".oddstable").querySelectorAll("tr");
          console.log(tr);
          let j = 0;
          for (let i = 1; i < tr.length; i++) {
            const td = tr[i].querySelectorAll("td");

            td.forEach((_node) => {
              if (_node.innerText.indexOf(".") !== -1) {
                oddsList.push({
                  racedate: date,
                  jyoCode: jyoCode,
                  raceNo: raceNo,
                  kumiban: boat_number[j++].join("-"),
                  odds: _node.innerText,
                });
              }
            });
          }
          return oddsList;
        },
        date,
        jyoCode,
        raceNo,
      );
      resultData.sort((a, b) => {
        if (Number(a.odds) < Number(b.odds)) return -1;
        if (Number(a.odds) > Number(b.odds)) return 1;
        return 0;
      });

      resultData.map((v, index) => {
        v.rank = String(index + 1);
      });
      console.log(JSON.stringify(resultData));
      stringify(resultData, (error, csvString) => {
        // ファイルシステムに対してファイル名を指定し、ファイルストリームを生成する.
        const writableStream = fs.createWriteStream(path.join("./sandbox/result/", `${jyoName}_${date}_${raceNo}.csv`));
        // csvStringをUTF-8で書き出す.
        writableStream.write(iconv.encode(csvString, "UTF-8"));
      });
    }
    startDate.setDate(startDate.getDate() + 1);
    // }
  }
})();

export async function getBrowserPage(addLaunchOptions?: puppeteer.LaunchOptions) {
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox"],
    ...addLaunchOptions,
  };
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["stylesheet", "image", "font", "script"].indexOf(req.resourceType()) >= 0) {
      req.abort();
    } else {
      req.continue();
    }
  });

  return page;
}
