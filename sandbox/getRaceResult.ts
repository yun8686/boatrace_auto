import https from "https";
import { RaceResultData, insertRaceResultData } from "../scraping/teleboat/models/RaceResultData";

(async () => {
  for (let date = new Date("2020/11/21"); date <= new Date("2020/11/30"); date.setDate(date.getDate() + 1)) {
    const raceResults: RaceResultData[] = [];
    for (let offset = 0; offset < 1000; offset += 10) {
      const results = await request(
        `https://v2.mizuhanome.net/api/raceresult?hd=${date.getFullYear()}${padding(date.getMonth() + 1)}${padding(
          date.getDate(),
        )}&offset=${offset}`,
      );
      console.log("date", date, offset, results.count);
      if (offset > results.count) {
        break;
      }
      results.rows.forEach((row) => {
        const key = Object.keys(row).filter((v) => v.indexOf("odds_3t") >= 0 && parseInt(row[v]) > 100);
        const key2t = Object.keys(row).filter((v) => v.indexOf("odds_2t") >= 0 && parseInt(row[v]) > 100);
        const { dataid, hd, jcd, rno } = row;
        if (key.length === 0) {
          console.log("none key", { key, dataid, hd, jcd, rno });
          raceResults.push({
            racedate: date,
            jyoCode: padding(parseInt(jcd)),
            raceNo: padding(parseInt(rno)),
            santankumiban: "9-9-9",
            santanodds: 100,
            nitankumiban: "9-9",
            nitanodds: 100,
          });
        } else if (key.length > 1) {
          console.log("Multi key ", { key, dataid, hd, jcd, rno });
        } else {
          const kumiban3t = key[0].replace("odds_3t", "").split("").join("-");
          const kumiban2t = key2t[0].replace("odds_2t", "").split("").join("-");
          const odds3t = parseInt(row[key[0]]) / 100;
          const odds2t = parseInt(row[key2t[0]]) / 100;
          raceResults.push({
            racedate: date,
            jyoCode: padding(parseInt(jcd)),
            raceNo: padding(parseInt(rno)),
            santankumiban: kumiban3t,
            santanodds: odds3t,
            nitankumiban: kumiban2t,
            nitanodds: odds2t,
          });
        }
      });
    }
    await insertRaceResultData(raceResults);
  }
  console.log("finish");
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
