import { getBrowserPage } from "../scraping/puppeteer";
import { getJyoCode } from "../scraping/teleboat/models/JyoMaster";
import { RaceInfo, insertRaceInfo } from "../scraping/teleboat/models/RaceInfo";
import https from "https";

(async () => {
  const raceInfos: RaceInfo[] = [];
  for (let date = new Date("2020/9/20"); date <= new Date("2020/9/20"); date.setDate(date.getDate() + 1)) {
    console.log("date", date);
    const results = await new Promise<{
      count: number;
      rows: { dataid: string; hd: string; jcd: string; rno: string; deadline: string }[];
    }>((resolve) => {
      const data = [];
      const req = https.request(
        `https://v2.mizuhanome.net/api/races?hd=${date.getFullYear()}${padding(date.getMonth() + 1)}${padding(date.getDate())}`,
        (res) => {
          res.on("data", (chunk) => {
            data.push(chunk);
          });
          res.on("end", () => {
            resolve(JSON.parse(Buffer.concat(data).toString("utf-8")));
          });
        },
      );
      req.end();
    });
    raceInfos.push(
      ...results.rows.map((result) => ({
        racedate: new Date(result.hd),
        jyoCode: padding(parseInt(result.jcd)),
        raceNo: padding(parseInt(result.rno)),
        time: parseInt(result.deadline.replace(/:/g, "")) / 100,
        daynum: null,
      })),
    );
    await insertRaceInfo(raceInfos);
  }
})();
function padding(num: number) {
  return `0${num}`.slice(-2);
}
