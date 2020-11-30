import { getBrowserPage } from "../scraping/puppeteer";
import { getJyoCode } from "../scraping/teleboat/models/JyoMaster";
import { BeforeInfo, insertBeforeInfo } from "../scraping/teleboat/models/RaceInfo";
import https from "https";

(async () => {
  for (let date = new Date("2020/01/01"); date <= new Date("2020/9/20"); date.setDate(date.getDate() + 1)) {
    console.log("date", date);
    const raceInfos: BeforeInfo[] = [];
    for (let offset = 0; offset < 1000; offset += 10) {
      const results = await request(
        `https://v2.mizuhanome.net/api/beforeinfo?hd=${date.getFullYear()}${padding(date.getMonth() + 1)}${padding(
          date.getDate(),
        )}&offset=${offset}`,
      );
      raceInfos.push(
        ...results.rows
          .filter((result) => result.wind !== null)
          .map((result) => ({
            racedate: new Date(result.hd),
            jyoCode: padding(parseInt(result.jcd)),
            raceNo: padding(parseInt(result.rno)),
            wind: parseInt(result.wind),
            windtext: result.wind,
            weather: result.weather,
          })),
      );
      await insertBeforeInfo(raceInfos);
      if (offset > results.count) {
        break;
      }
    }
  }
})();
function padding(num: number) {
  return `0${num}`.slice(-2);
}

function request(url: string) {
  return new Promise<{
    count: number;
    rows: { dataid: string; hd: string; jcd: string; rno: string; [key: string]: string }[];
  }>((resolve) => {
    const data = [];
    const req = https.request(url, (res) => {
      res.on("data", (chunk) => {
        data.push(chunk);
      });
      res.on("end", () => {
        resolve(JSON.parse(Buffer.concat(data).toString("utf-8")));
      });
    });
    req.end();
  });
}
