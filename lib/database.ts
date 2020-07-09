//const { DbError } = require("./_error");
import {createConnection, Connection} from 'mysql';
import {DB_CONFIG_PROTO, DB_CONFIG_PROTO_PT} from './constants';

function execute_query(serverName: string, query: any, queryParams: any[] = [], multipleStats: boolean = false): Promise<any> {
  return new Promise(async (resolve, reject) => {

    /*let session;
    try {
      session = await mysqlx.getSession(DB_CONFIG);
      session.sql(query).execute(result => {
        console.log(result.toArray());
        resolve(result);
      });
    } catch (err){
      console.log(err);
      //reject(new DbError(err));
    } finally {
      session && session.close();
    }*/

    let connection: Connection;
    switch(serverName) {
      case 'pt':
        DB_CONFIG_PROTO_PT['multipleStatements'] = multipleStats;
        connection = createConnection(DB_CONFIG_PROTO_PT);
        break;
      default:
        DB_CONFIG_PROTO['multipleStatements'] = multipleStats;
        connection = createConnection(DB_CONFIG_PROTO);
        break;
    }

    connection.connect();

    connection.query(query, queryParams, (err: any, res: unknown) => {
      connection.end();
      if (err) {
        console.log(err);
        reject(new Error(err.message));
      } else {
        resolve(res);
      }
    });
  });
}

function execute_query_proto(query: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const connection = createConnection(DB_CONFIG_PROTO);
    connection.connect();

    connection.query(query, (err: any, res: unknown) => {
      connection.end();
      if (err) {
        console.log(err);
        //reject(new DbError(err));
      } else {
        resolve(res);
      }
    });
  });
}

export {execute_query, execute_query_proto};
