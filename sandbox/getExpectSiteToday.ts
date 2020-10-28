// https://apaie.org/today/
// こちらのページの予測結果を取得
// 実行コマンド
// yarn ts-node sandbox/getExpectSiteToday.ts
import puppeteer, { Page, Response } from "puppeteer";
import stringify from "csv-stringify";
import iconv from "iconv-lite";
import fs from "fs";
import path from "path";
import { sleep } from "../scraping/teleboat/common";

let open_browser = false;

var main = async ()=> {
  console.log('実行中')
  const newDate = new Date();
  const nowTime = Number(`${newDate.getHours()}${('0' + newDate.getMinutes()).slice(-2)}`);

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
  const date = `${newDate.getFullYear()}-${newDate.getMonth()+1}-${newDate.getDate()}`;
  const page = await getBrowserPage({ headless: true });

  const get_data = async ()=>{
    // 10時以降で取得する
    if(!(nowTime >= 1000)){
      console.log('時間外:', nowTime)
      return false;
    }
    await page.goto("https://apaie.org/today/");
    open_browser = true;
    await page.waitForSelector('.today_list');
    const list = await page.$$(".today_list.gridset");
    for (let i=0; i < list.length; i++) {
      await sleep(1000)
      
      // データを取得
      let betsData = await page.evaluate((jyoData, date) => {
        const resultData = [];
        const li = document.querySelectorAll("li.grid");

        li.forEach(function (elem) {
          const siteName = elem.querySelector(".today_name").textContent;
          console.log(siteName)

          const race = elem.querySelector(".today_race").textContent;
          const raceNo = race.split('R')[0].match(/\d/)[0];
          const raceName = race.split('R')[0].split(/[0-9]{1,}/)[0].trim();

          console.log('raceNo',raceNo)
          console.log('raceName',raceName)

          const bets = [];
          const betElem = elem.querySelector(".clearfix").querySelectorAll("li");
          console.log('betElem',betElem);
          betElem.forEach(function (bet) {
            console.log('bet.textContent',bet.textContent);
            bets.push(bet.textContent.trim());
          })

          const codeObject = jyoData.filter(function(item, index){
            if (item.name == raceName) return true;
          });
          
          resultData.push({
            "siteName": siteName,
            "racedate": date,
            "jyoCode": codeObject[0].code,
            "raceNo": raceNo,
            "bets": bets
          });
        });
        // console.log(resultData);
        return resultData;
      },jyoData,date);

      // console.log(JSON.stringify(betsData));
      const now_time = new Date();

      const time = `${now_time.getHours()}:${('0' + now_time.getMinutes()).slice(-2)}`

      stringify(betsData, (error, csvString) => {
        // ファイルシステムに対してファイル名を指定し、ファイルストリームを生成する.
        const writableStream = fs.createWriteStream(path.join("./sandbox/betsTodayData/", `${date}_${time}.csv`));
        // csvStringをUTF-8で書き出す.
        writableStream.write(iconv.encode(csvString, "UTF-8"));
      });
    }
  }
  // 10分おきに取得
  setInterval(get_data, 60000 * 10)
};
main();

export async function getBrowserPage(addLaunchOptions?: puppeteer.LaunchOptions) {
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox"],
    ...addLaunchOptions,
  };
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", async (req) => {
    try {
        switch (await req.resourceType()) {
          case "stylesheet":
          case "image":
          case "font":
          case "script":
            await req.abort();
            break;
          default:
            await req.continue();
            break;
        }
      } 
    catch (e) {
      console.log(e);
    }
  });

  return page;
}
