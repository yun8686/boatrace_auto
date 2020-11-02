import { OddsData, ResultData } from "../../teleboat/types";
import {
  getPoorWallet,
  Barance01Wallet,
  insertOrderData,
  checkBlockWallet,
  Barance01Order,
  isExistsOrderData,
  addTweetList,
  getWinList,
  updateTweetListByTweetId,
  rebaranceWallet,
} from "./models";
import { RaceResultData } from "../../teleboat/models/RaceResultData";
import { getJyoName } from "../../teleboat/models/JyoMaster";
import { postTweet } from "../../../sns/twitter";

/**
 * 5番人気以下で6倍以上を買っていく
 *  SuperCocomo
 */

const targetJyocode = ["16", "12", "6", "24"];
const targetRate = 4.0 as const;
export const barance01_OddsCallback = async (oddsData: OddsData) => {
  const buyData: { kumiban: string; odds: number; price: number }[] = [];
  if (
    !(await isExistsOrderData({ ...oddsData, racedate: new Date() }))
    //&& targetJyocode.indexOf(oddsData.jyoCode) >= 0
  ) {
    const rentan3 = oddsData.rentan3.filter((v, i) => i >= 2 && i <= 4).reverse();
    for (const odds of rentan3) {
      const wallet = await getPoorWallet(1.0);
      const price = calcPrice(wallet, odds.odds);
      await insertOrderData({
        racedate: new Date(),
        jyoCode: oddsData.jyoCode,
        raceNo: oddsData.raceNo,
        kumiban: odds.kumiban,
        price: price,
        wallet_id: wallet.id,
      });
      buyData.push({
        kumiban: odds.kumiban,
        price: price,
        odds: odds.odds,
      });
    }
  }
  console.log("buyData", buyData);
  if (buyData.length > 0) {
    const message = `ローリスク・ローリターン検証中
    ${getJyoName(oddsData.jyoCode)}${Number(oddsData.raceNo)}R
    締切時刻 もう少し
    ${buyData.map((data) => `${data.kumiban} ${data.odds}倍 ${data.price}円`).join("\n")} 
    #競艇 #ココモ法 #資産運用 #不労収入
    `;
    const { id } = await postTweet(message);
    await Promise.all(
      buyData.map((data) => {
        return addTweetList({
          tweetid: id.toString(),
          racedate: new Date(),
          jyoCode: oddsData.jyoCode,
          raceNo: oddsData.raceNo,
          kumiban: data.kumiban,
          price: data.price,
        });
      }),
    );
  }
};

export const barance01_ResultCallback = async (resultData: ResultData[]) => {
  await checkBlockWallet();
  await rebaranceWallet();

  const winList = await getWinList();
  for (const winData of winList) {
    await updateTweetListByTweetId(winData.tweetid, { isreplied: true });
    await postTweet(`的中\n${winData.kumiban} ${winData.winprice}円 @GLJqugZsmmOfDb9`, winData.tweetid);
  }
};

function calcPrice(wallet: Barance01Wallet, odds: number) {
  const seed = [...Array(100000).keys()].map((i) => (i + 1) * 100);
  return seed.find((v) => (wallet.payout + v * odds) / (wallet.paysum + v) >= targetRate);
}
