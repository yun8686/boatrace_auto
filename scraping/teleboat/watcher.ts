import { Page, Response } from "puppeteer";
import { OddsData, Ren, ResultData } from "./types";
import { getResponseData, getRequestPayload } from "../puppeteer";

type Callbacks = {
  oddsCallback: ((oddsData: OddsData) => void)[];
  resultCallback: ((resultData: ResultData[]) => void)[];
};
export function setWatcher(page: Page, callbacks: Callbacks) {
  page.on("response", async (response: Response) => {
    if (response.url().indexOf("payout_list") >= 0) {
      const buf = await response.buffer();
      const data = JSON.parse(buf.toString("utf-8", 0, buf.length));
      const resultData: ResultData[] = data.map((result) => ({
        jyoCode: result.jyoCode,
        jyoData: result.jyoData.map((jyo) => ({
          raceList: jyo.raceList.map((race) => ({
            raceNo: race.raceNo,
            raceStatus: race.raceStatus,
            santanList: race.santanList.map((santan) => ({
              kumiban: santan.kumiban,
              payout: santan.payout,
              odds: parseInt(santan.payout) * 0.01,
            })),
          })),
        })),
      }));
      callbacks.resultCallback.forEach((fnc) => fnc(resultData));
    } else if (response.url().indexOf("/bet?") >= 0) {
      const request = getRequestPayload(response);
      const data = await getResponseData(response);
      const oddsData: OddsData = {
        jyoCode: request.jyoCode,
        raceNo: request.raceNo,
        rentan3: (data.oddsDetailListByKachishiki[6] as { kumiban: string; minOdds: number }[])
          .sort((a, b) => a.minOdds - b.minOdds)
          .map<Ren>((v) => ({ kumiban: v.kumiban as string, odds: v.minOdds as number })),
      };
      callbacks.oddsCallback.forEach((fnc) => fnc(oddsData));
    }
  });
}
