import mongoose, { mongo } from "mongoose";

const GPARecordSchema = new mongoose.Schema({
    courseId : {type : String, index : true},
    term : {type : String, index : true},
    instructor : {type : String, index : true},
    counts : {type : Object, default: {}},
    avgGpa : Number
}, {timestamps : true});

export default mongoose.models.GpaRecord || mongoose.model("GpaRecord", GPARecordSchema);