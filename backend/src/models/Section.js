import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema({
    days: [String],
    start : String, 
    end: String, 
    raw : String
}, {_id : false});

const SectionSchema = new mongoose.Schema({
    sectionId : {type : String, index : true},
    courseId : {type : String, index : true},
    term : {type : String, index : true},
    section : String, 
    crn : String, 
    instructor : String, 
    location : String, 
    modality : String, 
    meetings : [MeetingSchema],
    notes : String
}, {timestamps : true});

export default mongoose.models.Section || mongoose.model("Section", SectionSchema);
