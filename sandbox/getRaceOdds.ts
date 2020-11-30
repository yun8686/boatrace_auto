import https from "https";
import { RaceOddsData, replaceRaceData } from "../scraping/teleboat/models/RaceData";

(async () => {
  for (let date = new Date("2020/09/07"); date <= new Date("2020/11/21"); date.setDate(date.getDate() + 1)) {
    const raceResults: RaceOddsData[] = [];
    console.log(date.toLocaleDateString());
    for (let offset = 0; offset < 1000; offset += 10) {
      const results = await request(
        `https://v2.mizuhanome.net/api/odds?hd=${date.getFullYear()}${padding(date.getMonth() + 1)}${padding(
          date.getDate(),
        )}&offset=${offset}`,
      );
      if (offset > results.count) {
        break;
      }
      results.rows.forEach((row) => {
        const key3t = Object.keys(row).filter((v) => v.indexOf("odds_3t") >= 0);
        const key2t = Object.keys(row).filter((v) => v.indexOf("odds_2t") >= 0);
        const { dataid, hd, jcd, rno } = row;
        const raceOddsData: RaceOddsData = {
          racedate: date,
          jyoCode: padding(parseInt(jcd)),
          raceNo: padding(parseInt(rno)),
          rentan3: key3t
            .filter((key) => row[key] !== "欠場" && row[key] !== null)
            .map((key) => {
              const kumiban = key.replace("odds_3t", "").split("").join("-");
              const odds = parseFloat(row[key]);
              return { kumiban, odds: odds !== 0 ? odds : 9999 };
            })
            .sort((a, b) => a.odds - b.odds),
          rentan2: key2t
            .filter((key) => row[key] !== "欠場" && row[key] !== null)
            .map((key) => {
              const kumiban = key.replace("odds_2t", "").split("").join("-");
              const odds = parseFloat(row[key]);
              return { kumiban, odds: odds !== 0 ? odds : 9999 };
            })
            .sort((a, b) => a.odds - b.odds),
        };
        if (raceOddsData.rentan3.length > 0) {
          raceResults.push(raceOddsData);
        }
      });
    }
    await replaceRaceData(raceResults);
  }
  console.log("finish!");
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
