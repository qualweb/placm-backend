//const { DbError } = require("./_error");
import {createConnection, Pool} from 'mysql';
import {DB_CONFIG_PROTO} from './constants';
import { poolPT, pool as poolDefault, poolTest } from '..';

function execute_query(serverName: string, query: any, queryParams: any[] = []): Promise<any> {
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

    /* ************************************************************
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
    connection.beginTransaction((beginTranError: MysqlError) => {
      if (beginTranError) {
        //connection.end();
        reject(new Error(beginTranError.message));
      }

      connection.query(query, queryParams, (err: MysqlError | null, res: any) => {
        if (err) {
          console.log(err);
          connection.rollback((rollbackError: MysqlError) => {
            if(rollbackError) {
              reject(new Error(rollbackError.message));
            } else {
              reject(new Error(err.message));
            }
          });
        } else {
          connection.commit((commitError: MysqlError) => {
            if (commitError) {
              connection.rollback((rollbackError: MysqlError) => {
                if(rollbackError) {
                  reject(new Error(rollbackError.message));
                } else {
                  reject(new Error(commitError.message));
                }
              });
            }
            connection.end();
            resolve(res);
          });
        }
      });
    });************************************************************/

    let usingPool: Pool;
    switch(serverName) {
      case 'test':
        usingPool = poolTest;
        break;
      case 'pt':
        usingPool = poolPT;
        break;
      default:
        usingPool = poolDefault;
        break;
    }

    usingPool.getConnection(function(err, connection) {
      if(err){
        console.log(err);
        reject(new Error(err.message));
      } else {
        connection.query(query, queryParams, (err: any, res: unknown) => {
          connection.release();
          if (err) {
            console.log(err);
            reject(new Error(err.message));
          } else {
            resolve(res);
          }
        });
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
