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
//UPDATE STATUS POS
app.put('/pos', authenticateToken, (req, res) => {
    var conn = database();
    const pos_id = req.body.pos_id
    const status = req.body.status
    const sql = "UPDATE pos SET receive=? WHERE pos_id=?;";
    if ((pos_id == '' || pos_id == ' ') || (status == '' || status == ' ')) {
        res.status(400);
        res.send({ status: "fail", msg: "Update fail" });
        conn.end();
    } else {
        conn.query(sql, [status, pos_id], (err) => {
            if (err) {
                res.status(400);
                res.send({ status: "fail", msg: err });
                conn.end();
            } else {
                conn.end();
                res.send({ status: 'success', msg: "Update post status successfully" });
            }
        });
    }
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
                    comp_id: row.com_id,
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

//UPDATE STATUS COMPLAIN
app.put('/complain', authenticateToken, (req, res) => {
    var conn = database();
    const comp_id = req.body.comp_id
    const status = req.body.status
    const sql = "UPDATE complain SET status=? WHERE com_id=?;";
    if ((comp_id == '' || comp_id == ' ') || (status == '' || status == ' ')) {
        res.status(400);
        res.send({ status: "fail", msg: "Update fail" });
        conn.end();
    } else {
        conn.query(sql, [status, comp_id], (err) => {
            if (err) {
                res.status(400);
                res.send({ status: "fail", msg: err });
                conn.end();
            } else {
                conn.end();
                res.send({ status: 'success', msg: "Update complain status successfully" });
            }
        });
    }
});

////////////////////////////////////////////////////////////////
//
function generateWEBID(title, uid, room_no, month, year) {
    const MONTH = { "มกราคม": "01", "กุมภาพันธ์": "02", "มีนาคม": "03", "เมษายน": "04", "พฤษภาคม": "05", "มิถุนายน": "06", "กรกฎาคม": "07", "สิงหาคม": "08", "กันยายน": "09", "ตุลาคม": "10", "พฤศจิกายน": "11", "ธันวาคม": "12" };
    var str_id = "";
    str_id = title + uid + year + MONTH[month] + room_no;
    return str_id;
}

app.post('/bill',authenticateToken, (req, res) => {
    var conn = database();
    const room_no = req.body.room_no;
    const water_unit = req.body.water_unit;
    const electric_unit = req.body.electric_unit;
    const month = req.body.month;
    const year = req.body.year;
    const room_rate = req.body.room_rate;
    const water_rate = req.body.water_rate;
    const electric_rate = req.body.electric_rate;
    const sql_uid = "SELECT uid FROM user WHERE room_no=?";
    if ((room_no == '' || room_no == ' ') ||
        (water_unit == '' || water_unit == ' ') ||
        (electric_unit == '' || electric_unit == ' ') ||
        (month == '' || month == ' ') ||
        (year == '' || year == ' ') ||
        (room_rate == '' || room_rate == ' ') ||
        (water_rate == '' || water_rate == ' ') ||
        (electric_rate == '' || electric_rate == ' ')) {
        res.sendstatus(400);
    } else {
        conn.query(sql_uid, [room_no], (err, rows) => {
        if (err) {
            conn.end();
            res.status(400);
            res.send({ status: "fail", msg: err });
        } else {
            
            const uid = rows[0].uid;
            const ec_id=generateWEBID("EC",uid.toString(),room_no.toString(),month.toString(),year.toString());
            const wc_id=generateWEBID("WC",uid.toString(),room_no.toString(),month.toString(),year.toString());
            const rc_id=generateWEBID("RC",uid.toString(),room_no.toString(),month.toString(),year.toString());
            const bill_id=generateWEBID("BL",uid.toString(),room_no.toString(),month.toString(),year.toString());
            const ec = parseInt(electric_unit)*parseFloat(electric_rate);
            const wc = parseInt(water_unit)*parseFloat(water_rate);
            const rc = parseInt(room_rate);
            const total_cost = ec + wc + rc;
            const sql_CREATEBILL = "CALL createBILL(?,?,?,?,?,?,?,?,?,?,?,?,?);";
            conn.query(sql_CREATEBILL, [uid, rc_id, wc_id, ec_id, bill_id, month, year, parseInt(water_unit), parseInt(electric_unit), rc.toString(), wc.toString(), ec.toString(), total_cost.toString()], (err) => {
                if (err) {
                    res.status(400);
                    res.send({ status: "fail", msg: err });
                    conn.end();
                } else {
                    conn.end();
                    res.send({status: "success", msg: "Create bill successfuly"})
                }
            });
        }
    });
    }
});

//DELETE BILL
app.delete('/bill/:bill_id',authenticateToken, (req, res) => {
    var conn = database();
    const bill_id = req.params.bill_id;
    const sql = "CALL deleteBILL(?);";
    conn.query(sql, [bill_id], (err) => {
        if (err) {
            res.status(400);
            res.send({ status: "fail", msg: err });
            conn.end();
        }else{
            conn.end();
            res.sendStatus(204);
        }
    });

});

//UPDATE PAY BILL
app.put('/bill/:bill_id',authenticateToken, (req, res) => {
    var conn = database();
    const bill_id = req.params.bill_id;
    const sql = "CALL updatePayBILL(?);";
    conn.query(sql, [bill_id], (err) => {
        if (err) {
            res.status(400);
            res.send({ status: "fail", msg: err });
            conn.end();
        }else{
            conn.end();
            res.sendStatus(204);
        }
    });
});
//GET ALL BILL
app.get('/bill',authenticateToken, (req, res) => {
    var conn = database();  
    const sql = "SELECT * FROM view_bill;";
    conn.query(sql, (err, rows) => {
        if (err) {
            res.status(400);
            res.send({ status: "fail", msg: err });
            conn.end();
        } else {
            conn.end();
            const OBJ = rows.map((row) => {
                return {
                    bill_id: row.bill_id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    room_no: row.room_no,
                    e_unit: row.e_unit,
                    e_cost: row.e_cost,
                    w_unit: row.w_unit,
                    w_cost: row.w_cost,
                    r_cost: row.r_cost,
                    total_cost: row.total_cost,
                    date_pay: row.date_pay,
                    status: row.status
                }
            });
            res.send({ status: "success", data: OBJ });
        }
    });
});
//GET ONE BILL
app.get('/bill/:bill_id',authenticateToken, (req, res) => {
    var conn = database();
    const bill_id = req.params.bill_id;
    const sql = "SELECT * FROM view_bill WHERE bill_id=?;";
    conn.query(sql,[ bill_id], (err, rows) => {
        if (err) {
            res.status(400);
            res.send({ status: "fail", msg: err });
            conn.end();
        } else {
            conn.end();
            const OBJ = rows.map((row) => {
                return {
                    bill_id: row.bill_id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    room_no: row.room_no,
                    e_unit: row.e_unit,
                    e_cost: row.e_cost,
                    w_unit: row.w_unit,
                    w_cost: row.w_cost,
                    r_cost: row.r_cost,
                    total_cost: row.total_cost,
                    date_pay: row.date_pay,
                    status: row.status
                }
            });
            res.send({ status: "success", data: OBJ[0] });
        }
    });
});
    




app.listen(process.env.API_SERVER_PORT, process.env.HOST_SERVER_PORT, () => {
    console.log(`AUTH SERVER RUNNING ATT Http://${process.env.HOST}:${process.env.API_SERVER_PORT}`);
});