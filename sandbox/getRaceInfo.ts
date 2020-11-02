import { getBrowserPage } from "../scraping/puppeteer";
import { getJyoCode } from "../scraping/teleboat/models/JyoMaster";
import { RaceInfo, insertRaceInfo } from "../scraping/teleboat/models/RaceInfo";
import https from "https";

type ResponseType = {
  count: number;
  rows: {
    dataid: string;
    hd: string;
    jcd: string;
    rno: string;
    deadline: string;
    tbgradename: string;
    nj: string;
    nightflag: number;
  }[];
};
const getNextDate = (date: Date = new Date(), inc: number = 1) => {
  date.setDate(date.getDate() + inc);
  return date;
};
(async () => {
  const raceInfos: RaceInfo[] = [];
  for (let date = new Date("2020/10/28"); date <= getNextDate(); date.setDate(date.getDate() + 1)) {
    console.log("date", date);
    for (let offset = 0; offset < 1000; offset += 10) {
      const results = await new Promise<ResponseType>((resolve) => {
        const data = [];
        const req = https.request(
          `https://v2.mizuhanome.net/api/racecard?hd=${date.getFullYear()}${padding(date.getMonth() + 1)}${padding(
            date.getDate(),
          )}&offset=${offset}`,
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
      if (offset > results.count) {
        break;
      }
      raceInfos.push(
        ...results.rows.map((result) => ({
          racedate: new Date(result.hd),
          jyoCode: padding(parseInt(result.jcd)),
          raceNo: padding(parseInt(result.rno)),
          time: parseInt(result.deadline.replace(/:/g, "")) / 100,
          daynum: null,
          tbgradename: result.tbgradename,
          nj: result.nj,
          nightflag: result.nightflag,
        })),
      );
    }
    await insertRaceInfo(raceInfos);
  }
  console.log("finish");
})();
function padding(num: number) {
  return `0${num}`.slice(-2);
}
