import { logQuery } from "../../../database/database";
import { BuyStatus } from "../../teleboat/models/BuyData";

export type Barance01Wallet = {
  id?: number;
  paysum: number;
  payout: number;
  recovery_rate: number;
  block: boolean;
  used: boolean;
};
export type Barance01Order = {
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
export type Barance01TweetList = {
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
  // drop table barance01_wallet;
  `
      CREATE TABLE barance01_wallet (
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
    create trigger calc_recovery_rate before update
      on barance01_wallet 
      for each row
       set new.recovery_rate = case when new.paysum = 0 then 0 else new.payout/new.paysum end;
  `,
  // drop table barance01_order;
  `
    CREATE TABLE barance01_order (
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
    CREATE TABLE barance01_tweetlist (
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

export async function insertWalletData(walletData: Barance01Wallet) {
  await logQuery(`insert into barance01_wallet set ?`, [walletData]);
}

export async function updateWalletData(id: number, walletData: Partial<Barance01Wallet>) {
  await logQuery(`update barance01_wallet set ? where id = ?`, [walletData, id]);
}

export async function getPoorWallet(targetRate: number): Promise<Barance01Wallet> {
  const query = `
  select * 
  from barance01_wallet 
  where block = false 
  and   recovery_rate < ? 
  and   used = false
  order by recovery_rate, paysum-payout desc 
  limit 1;
  `;
  const result = await logQuery<Barance01Wallet>(query, [targetRate]);
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

export async function insertOrderData(orderData: Barance01Order) {
  await logQuery(`insert into barance01_order set ?`, [orderData]);
  await logQuery(`update barance01_wallet set paysum = paysum + ? where id = ?`, [orderData.price, orderData.wallet_id]);
}
export async function isExistsOrderData(orderData: { racedate: Date; jyoCode: string; raceNo: string }) {
  return (
    (
      await logQuery<{ cnt: number }>(
        `select count(1) as cnt from barance01_order
  where racedate = Date(?) and jyoCode = ? and raceNo = ?;
  `,
        [orderData.racedate, orderData.jyoCode, orderData.raceNo],
      )
    )[0].cnt > 0
  );
}

export async function checkBlockWallet() {
  const query = ` 
    update barance01_wallet w, barance01_order o, raceresult r
    set block = false
    where w.id = o.wallet_id 
    and   o.racedate = r.racedate
    and   o.jyocode = r.jyocode
    and   o.raceno = r.raceno
    and   w.block = true
    and   w.used = false
  `;

  await logQuery(query);
  await logQuery(`update barance01_wallet w
  set payout = COALESCE((
    select sum(price * santanodds) 
    from barance01_order o, raceresult r
    where o.racedate = r.racedate
    and   o.jyocode = r.jyocode
    and   o.raceno = r.raceno
    and   o.kumiban = r.santankumiban
    and   o.wallet_id = w.id), 0)
  `);
}

export async function addTweetList(tweetdata: Barance01TweetList) {
  await logQuery(`insert into barance01_tweetlist set ?`, [tweetdata]);
}
export async function updateTweetList(id: number, tweetdata: Partial<Barance01TweetList>) {
  await logQuery(`update barance01_tweetlist set ? where id = ?`, [tweetdata, id]);
}
export async function updateTweetListByTweetId(tweetid: string, tweetdata: Partial<Barance01TweetList>) {
  await logQuery(`update barance01_tweetlist set ? where tweetid = ?`, [tweetdata, tweetid]);
}

export async function getWinList() {
  return await logQuery<{ tweetid: string; kumiban: string; winprice: number }>(
    `select tweetid, kumiban, price*santanodds as winprice
     from barance01_tweetlist
     join raceresult using(racedate,jyocode,raceno)
     where isreplied = false and kumiban = santankumiban;
    `,
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
