import { Request,Response,NextFunction } from "express";
import DBService from "../services/dbService";

const THROTTLE_DB_NAME="throttle";

export default function(userID:number,actionName:string,requestPerMinute:number){
    return async function(req:Request,res:Response,next:NextFunction){
        const allowed:boolean=await checkThrottleState(userID,actionName,requestPerMinute);
        if(allowed)return next();
        return res.status(403).send("Unallowed operation, too many requests!");
    }
}

async function checkThrottleState(userID:number,actionName:string,requestPerMinute:number):Promise<boolean>{
    const records:any[]=await DBService.selectRecords(THROTTLE_DB_NAME,`where user_id=${userID} and action_name='${actionName}'`);
    if(records.length===0){
        await insertThrottleRecord(userID,actionName);
        return true;
    }else{
        const record:any=records[0];
        const actionCount:number=Number(record["action_count"]);
        const updatedAt:Date=new Date(record["updated_at"] as string);
        const now:Date=new Date();
        if(actionCount<requestPerMinute){
            await updateThrottleRecord(userID,actionName,actionCount+1);
            return true;
        }else{
            if(now.valueOf()-updatedAt.valueOf()>60000){
                await updateThrottleRecord(userID,actionName,1);
                return true;
            }
        }
    }
    return false;
}

async function insertThrottleRecord(userID:number,actionName:string):Promise<number|null>{
    const now:string=new Date().toISOString()
    return await DBService.insertRecord(THROTTLE_DB_NAME,{"user_id":userID,"action_name":actionName,"action_count":1,"updated_at":now});
}

async function updateThrottleRecord(userID:number,actionName:string,actionCount:number):Promise<boolean>{
    const now:string=new Date().toISOString()
    return await DBService.updateRecord(THROTTLE_DB_NAME,{"action_count":actionCount,"updated_at":now},`where user_id=${userID} and action_name='${actionName}'`);
}
