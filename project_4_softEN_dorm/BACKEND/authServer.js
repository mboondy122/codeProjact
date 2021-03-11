const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-Parser");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
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

function generateAccessToken(payload) {
    const data = {
        uid: payload.uid,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        tel: payload.tel,
        address: payload.address,
        room_no: payload.room_no
    };
    return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET,{expiresIn:process.env.EXP_TOKEN});
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
let refreshTokens = [];
//Renew Access token
app.post('/token', (req, res) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) {
        return res.sendStatus(401);

    }
    if (!refreshTokens.includes(refreshToken)) {
        return res.sendStatus(403);
    } jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, data) => {
        if (err) {
            return res.sendStatus(403);
        } else {
            const accessToken = generateAccessToken(data);
            console.log("Refresh token successfully");
            res.send({ status: 'success', data: { accessToken: accessToken } });
        }
    });
});

//USER LOGIN
app.post('/login', (req, res) => {
    var conn = database();
    const email = req.body.email;
    const password = req.body.password;
    const sql = "SELECT * FROM user WHERE email=?;";
    if (email == '' || email == ' ') {      
        res.status(400);
        res.send({ status: "fail", msg: "email is emtry" })
        conn.end();
    } else {
        conn.query(sql, [email], (err, rows) => {
            if (err) {
               conn.end();
                console.log("Error: ", err);
                res.status(400);
                res.send({ status: "fail", msg: err });
            } if (rows.length == 0) {
               conn.end();
                res.status(404);
                res.send({ status: "fail", msg: "Not found email" });
            }
            const OBJ = rows.map((row) => {
                return {
                    uid: row.uid,
                    first_name: row.fname,
                    last_name: row.lname,
                    email: row.email,
                    tel: row.tel,
                    address: row.address,
                    room_no: row.room_no

                }
            });
            const hashOBJ = rows.map((row) => {
                return {
                    password:row.password

                }
            });
            bcrypt.compare(password, hashOBJ[0].password, (err, result) => {
                if (result) {
                    conn.end();
                    const accessToken = generateAccessToken(OBJ[0]);
                    const refreshToken = jwt.sign(OBJ[0], process.env.REFRESH_TOKEN_SECRET);
                    console.log({ accessToken: accessToken, refreshToken: refreshToken });
                    refreshTokens.push(refreshToken);
                    res.send({ status: 'success', token: { accessToken: accessToken, refreshToken: refreshToken } });
                    
                } else {
                    conn.end();
                    res.status(401);
                res.send({ status: "fail", msg: "login fail" });
                }
            });
        });
        
    }
});

//CREATE USER
app.post('/user', (req, res) => {
    var conn = database();
    const uid = req.body.uid;
    const password = req.body.password;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const tel = req.body.tel;
    const address = req.body.address;
    const room_no = req.body.room_no;
    const sql = "INSERT INTO user (uid, password, fname, lname, email,tel,address,room_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    
    bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS, 10), (err, hash) => {
        conn.query(sql, [uid, hash,first_name, last_name, email, tel, address, room_no], (err) => {
            if (err) {
                conn.end();
                console.log("Error: ", err);
                res.status(400);
                res.send({ status: "fail", msg: err });
            } else {
                conn.end();
                res.status(201);
                res.send({ status: "success", msg: "Created user successfully" });
                
            }
        });
    });
});

//DELETE user 
app.delete('/user', authenticateToken, (req, res) => {
    var conn = database();
    const uid = req.payload.uid;
    const sql = "DELETE FROM user WHERE uid=?;";
    conn.query(
        sql, [uid], (err) => {
            if (err) {
                conn.end();
                console.log("Error: ", err);
                res.status(400);
                res.send({ status: "fail", msg: err });
            } else {
                conn.end();
                res.status(201);
                res.send({ status: "success", msg: "Deleted user successfully" });
                
            }
        });
});

app.put('/user', authenticateToken, (req, res) => {
    var conn = database();
    const uid = req.payload.uid;
    const email = req.payload.email;
    const fname = req.body.first_name;
    const lname = req.body.last_name;
    const tel = req.body.tel;
    const address = req.body.address;
    const room_no = req.body.room_no;
    const sql = "UPDATE user SET fname=?,lname=?,tel=?,address=?,room_no=? WHERE uid=?;";
    conn.query(sql, [fname, lname, tel, address, room_no, uid], (err) => {
        if (err) {
            conn.end();
                console.log("Error: ", err);
                res.status(400);
                res.send({ status: "fail", msg: err });

        } else {
            const OBJ = {
            uid: uid,
            first_name: fname,
            last_name: lname,
            email: email,
            tel: tel,
            address: address,
            room_no: room_no
            }
            conn.end();
            const accessToken = generateAccessToken(OBJ);
            const refreshToken = jwt.sign(OBJ, process.env.REFRESH_TOKEN_SECRET);
            console.log({ accessToken: accessToken, refreshToken: refreshToken });
            refreshTokens.push(refreshToken);
            res.send({ status: 'success', token: { accessToken: accessToken, refreshToken: refreshToken } });
        }
    });
});


app.listen(process.env.AUTH_SERVER_PORT, process.env.HOST_SERVER_PORT, () => {
    console.log(`AUTH SERVER RUNNING ATT Http://${process.env.HOST}:${process.env.AUTH_SERVER_PORT}`);
});