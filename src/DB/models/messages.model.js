import {model,Schema,Types} from "mongoose";

const messageSchema = new Schema({
    content:{
        type:String,
        min:5,
        required: function (){
            return this.attachments ?.length ?false:true
        } 
    },
    attachments:{
        type:[String]
    },
    reciver:{
        type:Types.ObjectId,
        ref:"User",
        required:true
    }
},{
    timestamps:true,
    query:false,
    strictQuery:true
})


export const Message = model("Messages" , messageSchema)