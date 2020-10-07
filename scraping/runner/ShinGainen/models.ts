import { logQuery } from "../../../database/database";
import { BuyStatus } from "../../teleboat/models/BuyData";

export type ShingainenWallet = {
  id?: number;
  paysum: number;
  payout: number;
  recovery_rate: number;
  block: boolean;
  used: boolean;
};
export type ShingainenOrder = {
  id?: number;
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  kumiban: string;
  price: number;
  isbuy?: boolean;
  buystatus?: BuyStatus;
  wallet_id: number;
};
export type ShingainenTweetList = {
  id?: number;
  tweetid: string;
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  kumiban: string;
  price: number;
  isreplied?: boolean;
};

const createTableQueries = [
  // drop table Shingainen_wallet;
  `
      CREATE TABLE Shingainen_wallet (
        id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        paysum int(11),
        payout int(11),
        recovery_rate double default 0,
        block bool default false,
        used boolean default false,
        index(recovery_rate)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
    `,
  `
    create trigger Shingainen_calc_recovery_rate before update
      on Shingainen_wallet 
      for each row
       set new.recovery_rate = case when new.paysum = 0 then 0 else new.payout/new.paysum end;
  `,
  // drop table Shingainen_order;
  `
    CREATE TABLE Shingainen_order (
      id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
      racedate date NOT NULL ,
      jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      kumiban varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      price int(11),
      isbuy boolean default false,
      buystatus varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci,
      wallet_id int,
      index(racedate,jyoCode,raceNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `,
  `
    CREATE TABLE Shingainen_tweetlist (
      id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
      tweetid varchar(30) not null,
      racedate date NOT NULL ,
      jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      kumiban varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      price int(11),
      isreplied boolean default false,
      index(racedate,jyoCode,raceNo),
      index(tweetid)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `,
];

export async function insertWalletData(walletData: ShingainenWallet) {
  await logQuery(`insert into Shingainen_wallet set ?`, [walletData]);
}

export async function updateWalletData(id: number, walletData: Partial<ShingainenWallet>) {
  await logQuery(`update Shingainen_wallet set ? where id = ?`, [walletData, id]);
}

export async function getPoorWallet(targetRate: number): Promise<ShingainenWallet> {
  const query = `
  select * 
  from Shingainen_wallet 
  where block = false 
  and   recovery_rate < ? 
  and   used = false
  order by recovery_rate, paysum-payout desc 
  limit 1;
  `;
  const result = await logQuery<ShingainenWallet>(query, [targetRate]);
  if (result.length > 0) {
    await updateWalletData(result[0].id, { block: true });
    return result[0];
  } else {
    await insertWalletData({
      paysum: 0,
      payout: 0,
      recovery_rate: 0,
      block: false,
      used: false,
    });
    return await getPoorWallet(targetRate);
  }
}

export async function insertOrderData(orderData: ShingainenOrder) {
  await logQuery(`insert into Shingainen_order set ?`, [orderData]);
  await logQuery(`update Shingainen_wallet set paysum = paysum + ? where id = ?`, [orderData.price, orderData.wallet_id]);
}
export async function isExistsOrderData(orderData: { racedate: Date; jyoCode: string; raceNo: string }) {
  return (
    (
      await logQuery<{ cnt: number }>(
        `select count(1) as cnt from Shingainen_order
  where racedate = Date(?) and jyoCode = ? and raceNo = ?;
  `,
        [orderData.racedate, orderData.jyoCode, orderData.raceNo],
      )
    )[0].cnt > 0
  );
}

export async function rebaranceWallet(): Promise<void> {
  const winwallets = await logQuery<ShingainenWallet>(
    `select * from Shingainen_wallet 
      where used = 0 and block = 0 and payout-paysum > 100;`,
  );
  let overPayoutSum = 0;
  for (const winwallet of winwallets) {
    const newPaysum = winwallet.payout - 100;
    overPayoutSum += newPaysum - winwallet.paysum;
    await updateWalletData(winwallet.id, { paysum: newPaysum });
  }
  const wallets = await logQuery<ShingainenWallet>(`
    select * from Shingainen_wallet where used = 0 and block = 0 and paysum > payout;
  `);
  if (wallets.length === 0) return;

  const sum = wallets.reduce((prev, curr) => prev + curr.paysum - curr.payout, 0) - overPayoutSum;
  await logQuery(
    `update Shingainen_wallet set paysum = ${Math.floor(sum / wallets.length)} where id in (${wallets.map((v) => v.id).join(",")})`,
  );
}

export async function checkBlockWallet() {
  const query = ` 
    update Shingainen_wallet w, Shingainen_order o, raceresult r
    set block = false
    where w.id = o.wallet_id 
    and   o.racedate = r.racedate
    and   o.jyocode = r.jyocode
    and   o.raceno = r.raceno
    and   w.block = true
    and   w.used = false
  `;

  await logQuery(query);
  await logQuery(`update Shingainen_wallet w
  set payout = COALESCE((
    select sum(price * santanodds) 
    from Shingainen_order o, raceresult r
    where o.racedate = r.racedate
    and   o.jyocode = r.jyocode
    and   o.raceno = r.raceno
    and   o.kumiban = r.santankumiban
    and   o.wallet_id = w.id), 0)
  `);
}

export async function addTweetList(tweetdata: ShingainenTweetList) {
  await logQuery(`insert into Shingainen_tweetlist set ?`, [tweetdata]);
}
export async function updateTweetList(id: number, tweetdata: Partial<ShingainenTweetList>) {
  await logQuery(`update Shingainen_tweetlist set ? where id = ?`, [tweetdata, id]);
}
export async function updateTweetListByTweetId(tweetid: string, tweetdata: Partial<ShingainenTweetList>) {
  await logQuery(`update Shingainen_tweetlist set ? where tweetid = ?`, [tweetdata, tweetid]);
}

export async function getWinList() {
  return await logQuery<{ tweetid: string; kumiban: string; winprice: number }>(
    `select tweetid, kumiban, price*santanodds as winprice
     from Shingainen_tweetlist
     join raceresult using(racedate,jyocode,raceno)
     where isreplied = false and kumiban = santankumiban;
    `,
  );
}

export async function getDailyResults() {
  return await logQuery<{ paysum: number; payout: number }>(
    `select
        sum(price) paysum,
        round(sum(price*santanodds*case when santankumiban=kumiban then 1 else 0 end)) payout
        from Shingainen_order 
        join raceresult using (racedate,jyocode,raceno)
        where racedate = current_date;`,
  );
}
async () => {
  const wal = await getPoorWallet(1.5);
  console.log(wal);
  await updateWalletData(wal.id, {
    paysum: 100,
  });
  await insertOrderData({
    racedate: new Date("2020-01-01"),
    jyoCode: "06",
    raceNo: "01",
    kumiban: "2-3-1",
    price: 100,
    wallet_id: wal.id,
  });
  await checkBlockWallet();
};

async () => {
  await insertOrderData({
    racedate: new Date(),
    jyoCode: "01",
    raceNo: "01",
    kumiban: "1-2-3",
    price: 100,
    wallet_id: 1,
  });
};
