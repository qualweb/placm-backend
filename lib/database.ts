//const { DbError } = require("./_error");
import {createConnection} from 'mysql';
import {DB_CONFIG, DB_CONFIG_PROTO} from './constants';
//import {DB_CONFIG_X} from './constants';

function execute_query(query: any): Promise<any> {
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

    const connection = createConnection(DB_CONFIG);
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
