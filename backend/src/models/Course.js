import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
    courseId : {type: String, index : true},
    subject : {type: String, index : true},
    number : {type: String, index : true},
    title : String, 
    description : String, 
    credits : Number,
    genEds : [String],
    prereqText : String, 
    termsOffered : [String]
    
}, {timestamps: true});

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);