const config = require("../settings/mysql.setting.json");
import mysql, { Connection, queryCallback } from "mysql";

let connection: mysql.Connection;
const connectDatabase = async () => {
  connection = await mysql.createConnection(config);
  return new Promise<mysql.Connection>((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        reject("Connect Error mysql" + err.stack);
      }
      resolve(connection);
    });
  });
};

export const getConnection = async () => {
  return connection ? connection : await connectDatabase();
};

export async function logQuery<T>(sql: string, values?: any[]) {
  try {
    const connection = await getConnection();
    const query = connection.format(sql, values ? values : undefined);
    return new Promise<T[]>((resolve, reject) =>
      connection.query(query, (err, results) => {
        if (err) {
          console.log("era-", err);
          reject(err);
        }
        console.log(query);
        resolve(results);
      }),
    );
  } catch (e) {
    console.log(sql, e);
    throw "era-";
  }
}
