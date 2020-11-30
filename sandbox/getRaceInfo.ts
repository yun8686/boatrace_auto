import { getBrowserPage } from "../scraping/puppeteer";
import { getJyoCode } from "../scraping/teleboat/models/JyoMaster";
import { RaceInfo, replaceRaceInfo, RacersInfo, insertRacersInfo } from "../scraping/teleboat/models/RaceInfo";
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

    player1_teino: number;
    player2_teino: number;
    player3_teino: number;
    player4_teino: number;
    player5_teino: number;
    player6_teino: number;

    player1_racerno: string;
    player2_racerno: string;
    player3_racerno: string;
    player4_racerno: string;
    player5_racerno: string;
    player6_racerno: string;

    player1_racername: string;
    player2_racername: string;
    player3_racername: string;
    player4_racername: string;
    player5_racername: string;
    player6_racername: string;

    player1_classname: string;
    player2_classname: string;
    player3_classname: string;
    player4_classname: string;
    player5_classname: string;
    player6_classname: string;

    player1_zwinper: string;
    player2_zwinper: string;
    player3_zwinper: string;
    player4_zwinper: string;
    player5_zwinper: string;
    player6_zwinper: string;

    player1_jwinper: string;
    player2_jwinper: string;
    player3_jwinper: string;
    player4_jwinper: string;
    player5_jwinper: string;
    player6_jwinper: string;
  }[];
};
const getNextDate = (date: Date = new Date(), inc: number = 1) => {
  date.setDate(date.getDate() + inc);
  return date;
};
(async () => {
  //  for (let date = new Date(); date <= getNextDate(); date.setDate(date.getDate() + 1)) {
  for (let date = new Date(); date <= getNextDate(); date.setDate(date.getDate() + 1)) {
    const raceInfos: RaceInfo[] = [];
    const racersInfo: RacersInfo[] = [];
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
      for (let teino = 1; teino <= 6; teino++) {
        racersInfo.push(
          ...results.rows.map<RacersInfo>((result) => ({
            racedate: new Date(result.hd),
            jyoCode: padding(parseInt(result.jcd)),
            raceNo: padding(parseInt(result.rno)),
            teino: parseInt(result[`player${teino}_teino`]),
            racerno: result[`player${teino}_racerno`],
            racername: result[`player${teino}_racername`],
            classname: result[`player${teino}_classname`],
            zwinper: parseFloat(result[`player${teino}_zwinper`]),
            jwinper: parseFloat(result[`player${teino}_jwinper`]),
          })),
        );
      }
    }
    await replaceRaceInfo(raceInfos);
    await insertRacersInfo(racersInfo);
  }
  console.log("finish");
})();
function padding(num: number) {
  return `0${num}`.slice(-2);
}
