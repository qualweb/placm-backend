"use strict";
//const { DbError } = require("./_error");
var mysql_1 = require("mysql");
var constants_1 = require("./constants");
function execute_query(query) {
    return new Promise(function (resolve, reject) {
        var connection = mysql_1.createConnection(constants_1.constants.DB_CONFIG);
        connection.connect();
        connection.query(query, function (err, res) {
            connection.end();
            if (err) {
                //reject(new DbError(err));
            }
            else {
                resolve(res);
            }
        });
    });
}
module.exports = execute_query;
