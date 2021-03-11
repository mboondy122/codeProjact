const mongoose = require('mongoose');

var trackSchema = mongoose.Schema({
    track_no: String,
    s_name: String,
    s_tel: String,
    r_name: String,
    r_tel: String,
    r_address: String,
    r_postcode: String,
    r_province: String,
    dateEnter: Date,
    shipmentStatus: Array,
    shipment: Array
});
var trackObj = mongoose.model('trackobj', trackSchema);
module.exports = trackObj;
