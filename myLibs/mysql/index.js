const mysql = require('mysql')
const config = require('@rd/config');
const connection = mysql.createPool(config.mysql);

var sql = {
    query : async function (sql, args) {
        return new Promise((resolve, reject) => {
            connection.query(sql, args, (err, rows) => {
                if (err) resolve(err);
                resolve(rows);
            });
        });
    },
}

sql.stmt =  {
    createUser: "insert into user(fullname,email,pass) values(?,?,?)"
};

module.exports = sql;