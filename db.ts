import * as mysql from 'mysql2';

const db = mysql.createPool({
    host: "idp-soyyo-test-bd.cvxhtedkaix9.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "rRGpdFVbFcnsnjNJiH90",
    database: "idpsoyyotest"
})

module.exports = db.promise()