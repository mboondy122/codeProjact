const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-Parser");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");

function database() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DBNAME,
        charset: process.env.DB_CHARSET,

    });
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTION");
    res.header("Access-Control-Allow-Headers", "Origin, x-requested-With,Content-Type,Accept,x-client-key,x-client-token,x-client-secret,Authorization");
    next();

});

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (authHeader == null) {
        return res.sendStatus(401);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) {
            console.log(err);
            return res.sendStatus(403);
        }
        req.payload = payload;
        next();
    });
}
app.get('/', (req, res) => {
    var conn = database();
    conn.connect((err) => {
        if (err) {
            //res.statusCode(502);
            res.send({ status: "fail", msg: err });
            conn.end();

        } else {
            res.status(200);
            res.send({ status: "success", msg: "Connected database successfully" });
            conn.end();
        } 
    });
});

//GET ANNOUNCE
app.get("/announce",authenticateToken, (req, res) => {
    var conn = database();
    const sql = "SELECT * FROM announce ORDER BY ann_id DESC;";
    conn.query(sql,(err, rows)=> {
        if (err) {
            conn.end();
                console.log("Error: ", err);
                res.status(400);
                res.send({ status: "fail", msg: err });
        } else {
            conn.end();
            const data = rows.map((row) => {
                return {
                    ann_id: row.ann_id,
                    topic: row.topic,
                    description: row.description,
                    date_post: row.date_post
                }
            });
            console.log(data);
            res.send({ status: "success", data: data });
        }
    });
});

//GET POS
app.get("/pos",authenticateToken, (req, res) => {
    var conn = database();
    const sql = "SELECT * FROM view_pos WHERE status ='ยังไม่มารับ'ORDER BY date DESC;";
    conn.query(sql,(err, rows)=> {
        if (err) {
            conn.end();
                console.log("Error: ", err);
                res.status(400);
                res.send({ status: "fail", msg: err });
        } else {
            conn.end();
            const data = rows.map((row) => {
                return {
                    pos_id: row.pos_id,
                    name: row.name,
                    date: row.date,
                    status: row.status
                }
            });
            console.log(data);
            res.send({ status: "success", data: data });
        }
    });
});
//GET COMPLAIN
app.get("/complain",authenticateToken, (req, res) => {
    var conn = database();
    const sql = "SELECT * FROM view_complain ORDER BY com_id DESC;";
    conn.query(sql,(err, rows)=> {
        if (err) {
            conn.end();
                console.log("Error: ", err);
                res.status(400);
                res.send({ status: "fail", msg: err });
        } else {
            conn.end();
            const data = rows.map((row) => {
                return {
                    com_id: row.com_id,
                    topic: row.topic,
                    date_post: row.date_post,
                    description: row.description,
                    status: row.status,
                    first_name: row.fname,
                    last_name: row.lname,
                    room_no: row.room_no
                }
            });
            console.log(data);
            res.send({ status: "success", data: data });
        }
    });
});

app.listen(process.env.API_SERVER_PORT, process.env.HOST_SERVER_PORT, () => {
    console.log(`AUTH SERVER RUNNING ATT Http://${process.env.HOST}:${process.env.API_SERVER_PORT}`);
});