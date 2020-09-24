import { OddsData, ResultData } from "../../teleboat/types";
import { getPoorWallet, Barance01Wallet, insertOrderData, checkBlockWallet } from "./models";
import { RaceResultData } from "../../teleboat/models/RaceResultData";

/**
 * 5番人気以下で6倍以上を買っていく
 *  SuperCocomo
 */

const targetJyocode = ["24", "18", "19", "22", "12", "21"];
const targetRate = 1.5 as const;
export const barance01_OddsCallback = async (oddsData: OddsData) => {
  if (targetJyocode.indexOf(oddsData.jyoCode) >= 0) {
    const rentan3 = oddsData.rentan3.filter((v, i) => i <= 5 && v.odds >= 6).reverse();
    for (const odds of rentan3) {
      const wallet = await getPoorWallet(targetRate);
      const price = calcPrice(wallet, odds.odds);
      await insertOrderData({
        racedate: new Date(),
        jyoCode: oddsData.jyoCode,
        raceNo: oddsData.raceNo,
        kumiban: odds.kumiban,
        price: price,
        wallet_id: wallet.id,
      });
    }
  }
};

export const barance01_ResultCallback = async (resultData: ResultData[]) => {
  await checkBlockWallet();
};

function calcPrice(wallet: Barance01Wallet, odds: number) {
  const seed = [...Array(100000).keys()].map((i) => (i + 1) * 100);
  return seed.find((v) => (wallet.payout + v * odds) / (wallet.paysum + v) >= targetRate);
}
