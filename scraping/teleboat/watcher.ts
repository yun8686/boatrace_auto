import { Page, Response } from "puppeteer";
import { OddsData, Ren, ResultData, Result } from "./types";
import { getResponseData, getRequestPayload } from "../puppeteer";

type Callbacks = {
  oddsCallback: ((oddsData: OddsData) => Promise<void>)[];
  resultCallback: ((resultData: ResultData[]) => Promise<void>)[];
};
export function setWatcher(page: Page, callbacks: Callbacks) {
  page.on("response", async (response: Response) => {
    const url = response.url();
    if (!url.endsWith(".svg")) {
      console.log("response url", response.url());
    }
    if (response.url().indexOf("payout_list") >= 0) {
      const buf = await response.buffer();
      const data = JSON.parse(buf.toString("utf-8", 0, buf.length));
      const resultData: ResultData[] = (data.jyoList || []).map((jyo: { jyoCode: string; raceList: any[] }) => ({
        jyoCode: jyo.jyoCode,
        raceList: jyo.raceList
          .filter(({ raceStatus }) => raceStatus === "4")
          .map((race: { raceNo: string; raceStatus: string; santanList: any[] }) => ({
            raceNo: race.raceNo,
            raceStatus: race.raceStatus,
            santanList: race.santanList.map<Result>(
              (santan: { kumiban: string; payout: string }) =>
                ({
                  kumiban: santan.kumiban,
                  payout: parseInt(santan.payout),
                  odds: parseInt(santan.payout) * 0.01,
                } as Result),
            ),
          })),
      }));
      if (callbacks.resultCallback.length > 0) {
        for (let i = 0; i < callbacks.resultCallback.length; i++) {
          try {
            await callbacks.resultCallback[i](resultData);
          } catch (e) {
            console.error("callbacks.resultCallback", e);
          }
        }
      }
    } else if (response.url().indexOf("/bet?") >= 0) {
      const request = getRequestPayload(response);
      const data = await getResponseData(response);
      const oddsData: OddsData = {
        jyoCode: request.jyoCode,
        raceNo: request.raceNo,
        rentan3: (data.oddsDetailListByKachishiki[6] as { kumiban: string; minOdds: number }[])
          .sort((a, b) => (a.minOdds || 9999) - (b.minOdds || 9999))
          .map<Ren>((v) => ({ kumiban: v.kumiban as string, odds: v.minOdds as number })),
        rentan2: (data.oddsDetailListByKachishiki[3] as { kumiban: string; minOdds: number }[])
          .sort((a, b) => (a.minOdds || 9999) - (b.minOdds || 9999))
          .map<Ren>((v) => ({ kumiban: v.kumiban as string, odds: v.minOdds as number })),
      };

      if (callbacks.oddsCallback.length > 0) {
        for (let i = 0; i < callbacks.oddsCallback.length; i++) {
          try {
            await callbacks.oddsCallback[i](oddsData);
          } catch (e) {
            console.error("callbacks.resultCallback", e);
          }
        }
      }
    }
  });
}
