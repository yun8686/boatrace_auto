// https://apaie.org/free/?days=180
// こちらのページの予測結果を取得
// 実行コマンド
// yarn ts-node sandbox/getExpectSiteHistory.ts
import puppeteer, { Page, Response } from "puppeteer";
import stringify from "csv-stringify";
import iconv from "iconv-lite";
import fs from "fs";
import path from "path";
import { sleep } from "../scraping/teleboat/common";

(async () => {
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

  const page = await getBrowserPage({ headless: false });
  await page.goto("https://apaie.org/free/?days=180");

  // 遷移ボタンを取得
  const clickLists = await page.$$(".freelist > li");
  for (let i=0; i < clickLists.length; i++) {

    const lists = await page.$$(".freelist > li");
    await sleep(1000)
    await lists[i].click();
    await page.waitForSelector('.categoryNav');

    // データを取得
    let betsData = await page.evaluate((jyoData) => {
      const h2 = document.querySelector(".categoryNav > h2");
      const siteName = h2.textContent.match(/(?<=\「).*?(?=\」)/);
      
      const resultData = [];
      const dl = document.querySelectorAll(".betlist > dl");

      dl.forEach(function (elem) {
        const date = elem.querySelector(".date").textContent.trim();
        const race = elem.querySelector(".race").textContent;
        const raceNo = race.match(/\d/)[0];
        const raceName = race.split(/[0-9]{1,}/)[0];

        const bets = [];
        const betElem = elem.querySelector(".bet").querySelectorAll("span");
        betElem.forEach(function (bet) {
          console.log(bet.textContent);
          bets.push(bet.textContent.trim());
        })

        const codeObject = jyoData.filter(function(item, index){
          if (item.name == raceName) return true;
        });
        
        resultData.push({
          "siteName": siteName[0],
          "racedate": date,
          "jyoCode": codeObject[0].code,
          "raceNo": raceNo,
          "bets": bets
        });
      });
      return resultData;
    },jyoData);

    console.log(JSON.stringify(betsData).replace(/"/g, "'"));
    stringify(betsData, (error, csvString) => {
      // ファイルシステムに対してファイル名を指定し、ファイルストリームを生成する.
      const writableStream = fs.createWriteStream(path.join("./sandbox/betsData/", `${betsData[0].siteName}.csv`));
      // csvStringをUTF-8で書き出す.
      writableStream.write(iconv.encode(csvString, "UTF-8"));
    });
    await page.goto("https://apaie.org/free/?days=180");
    await sleep(1000)
  }

  await page.close();
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
