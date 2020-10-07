type JyoMaster = {
  code: string;
  name: string;
};

export function getJyoName(code: string) {
  return data.find((v) => v.code === code).name;
}
export function getJyoCode(name: string) {
  return data.find((v) => v.name === name).code;
}
const data: JyoMaster[] = [
  { code: "01", name: "桐生" },
  { code: "02", name: "戸田" },
  { code: "03", name: "江戸川" },
  { code: "04", name: "平和島" },
  { code: "05", name: "多摩川" },
  { code: "06", name: "浜名湖" },
  { code: "07", name: "蒲郡" },
  { code: "08", name: "常滑" },
  { code: "09", name: "津" },
  { code: "10", name: "三国" },
  { code: "11", name: "びわこ" },
  { code: "12", name: "住之江" },
  { code: "13", name: "尼崎" },
  { code: "14", name: "鳴門" },
  { code: "15", name: "丸亀" },
  { code: "16", name: "児島" },
  { code: "17", name: "宮島" },
  { code: "18", name: "徳山" },
  { code: "19", name: "下関" },
  { code: "20", name: "若松" },
  { code: "21", name: "芦屋" },
  { code: "22", name: "福岡" },
  { code: "23", name: "唐津" },
  { code: "24", name: "大村" },
];

// create table jyomst (code varchar(2) primary key CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL , name varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL );
