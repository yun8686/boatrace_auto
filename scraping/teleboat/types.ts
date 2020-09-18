export type OddsData = {
  jyoCode: string;
  raceNo: string;
  rentan3: Ren[];
  rentan2: Ren[];
};

export type Ren = {
  kumiban: string;
  odds: number;
};

export type ResultData = {
  jyoCode: string;
  raceList: {
    raceNo: string;
    raceStatus: "4" | null;
    santanList: Result[];
  }[];
};
export type Result = {
  kumiban: string;
  payout: number;
  odds: number;
};
