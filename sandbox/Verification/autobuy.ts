import { getRaceData, getRaceData2, getTestData } from "../../scraping/teleboat/models/RaceData";
import PriorityQueue from "ts-priority-queue";

type Verify = {
  ren: number;
  maxren: number;
  payout: number;
  paysum: number;
  buycnt: number;
  wincnt: number;
  burstcnt: number;
};
const createVerify = () => ({
  ren: 0,
  maxren: 0,
  payout: 0,
  paysum: 0,
  buycnt: 0,
  wincnt: 0,
  burstcnt: 0,
});
const seed = [...Array(100000).keys()].map((i) => (i + 1) * 100);

const allcoocmo = async () => {
  const raceData = await getRaceData2(new Date("2020-01-01"), new Date("2020-11-01"));
  const queue = new PriorityQueue<Verify>({
    comparator: (a, b) => a.payout / a.paysum - b.payout / b.paysum,
  });
  const dataSet = {};
  raceData.forEach((data) => {
    const key = `${data.racedate.getTime()}_${data.jyoCode}_${data.raceNo}`;
    if (!dataSet[key]) dataSet[key] = [];
    const win = data.santankumiban === data.kumiban;
    dataSet[key].push({
      win,
      odds: data.odds,
      santanodds: data.santanodds,
    });
  });
  const calcPrice = (payout, paysum, odds) => {
    const ans = seed.find((v) => (payout + v * odds) / (paysum + v) >= 1.1);
    return ans;
  };
  let maxbet = 0;
  Object.keys(dataSet).forEach((key) => {
    const data = dataSet[key];
    const nextVerify: Verify[] = [];
    data.forEach((d) => {
      if (queue.length === 0) {
        queue.queue(createVerify());
      }
      const curr = queue.dequeue();
      const price = calcPrice(curr.payout, curr.paysum, d.odds);
      maxbet = Math.max(maxbet, price);
      nextVerify.push({
        ren: d.win ? 1 : curr.ren + 1,
        maxren: Math.max(curr.maxren, curr.ren + 1),
        payout: d.win ? price * d.santanodds + curr.payout : curr.payout,
        paysum: curr.paysum + price,
        buycnt: curr.buycnt + 1,
        wincnt: d.win ? curr.wincnt + 1 : curr.wincnt,
        burstcnt: 0,
      });
    });
    nextVerify.forEach((v) => queue.queue(v));
  });
  let payout = 0,
    paysum = 0;
  while (queue.length > 0) {
    const curr = queue.dequeue();
    console.log(curr);
    payout += curr.payout;
    paysum += curr.paysum;
  }
  console.log("maxbet", { maxbet, payout, paysum });
  //  console.log(raceData);
};

const jyoBetsu = async () => {
  const raceData = await getRaceData(new Date("2020-01-01"), new Date("2020-10-30"));
  const map: {
    [jyocode: string]: {
      ren: number;
      maxren: number;
      payout: number;
      pays: { cost: number; win: boolean }[];
      paysum?: number;
      buycnt: number;
      wincnt: number;
      burstcnt: number;
    };
  } = {};
  for (const data of raceData) {
    map[data.jyoCode] = map[data.jyoCode] || { ren: 0, maxren: 0, payout: 0, pays: [], buycnt: 0, wincnt: 0, burstcnt: 0 };
    const currPay = {
      cost: table[map[data.jyoCode].ren],
      //      cost: pays.length < 2 ? 100 : pre1.win || pre2.win ? 100 : pre1.cost + pre2.cost,
      win: data.santankumiban === data.kumiban,
    };
    map[data.jyoCode].pays.push(currPay);
    map[data.jyoCode].buycnt++;
    if (currPay.win) {
      map[data.jyoCode].wincnt++;
      map[data.jyoCode].ren = 0;
      map[data.jyoCode].payout += Math.round(data.santanodds * currPay.cost);
    } else {
      map[data.jyoCode].ren++;
      map[data.jyoCode].maxren = Math.max(map[data.jyoCode].maxren, map[data.jyoCode].ren);
      if (map[data.jyoCode].ren === 20) {
        map[data.jyoCode].ren = 0;
        map[data.jyoCode].burstcnt++;
      }
    }
  }
  let paysum = 0,
    payout = 0;
  Object.keys(map).forEach((k) => {
    map[k].paysum = map[k].pays.reduce((a, c) => a + c.cost, 0);
    delete map[k].pays;
    paysum += map[k].paysum;
    payout += map[k].payout;
  });
  console.log(map);
  console.log(paysum, payout, payout / paysum);
  console.log(table.slice(0, 100));
};

const table = (() => {
  const arr = [100];
  let sum = 100;
  for (let i = 1; i <= 100; i++) {
    arr[i] = seed.find((v, i) => v * 5 >= sum * 1.5);
    //    arr[i] = (arr[i - 1] || 0) + (arr[i - 2] || 0);
    sum += arr[i];
  }
  return arr;
})();

(async () => {
  //jyoBetsu();
  await allcoocmo();
})();
