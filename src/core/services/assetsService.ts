import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Response,Request } from 'express';

export type AssetType="img"|"snd"|"vid"|"doc"|"other";
class AssetsService{
    static AssetTypesExtensions:{[key:string]:string[]}={
        "img":[],
        "snd":[],
        "vid":[],
        "doc":[],
        "other":[],
    }
    static UPLOADED_FILES_DIR_PATH:string="./uploads/";
    static uploader:multer.Multer;

    static init(){
        AssetsService.uploader=multer({ dest:AssetsService.UPLOADED_FILES_DIR_PATH});
    }

    static async uploadFile(userID:number|null,req:Request,allowedExtensions:string[],maxSize:number):Promise<string|null>{
        console.log("file",req.file);
        if(!req.file){
            return null;
        }
        // Validate file extension
        const fileExtension=path.extname(req.file.originalname).toLowerCase();
        if(allowedExtensions.length>0&&!allowedExtensions.includes(fileExtension)){
            return null;
        }
        //Validate file size(bytes)
        if(req.file.size>maxSize){
            return null;
        }
        // Determine the upload directory based on userID
        let uploadDirectory=AssetsService.UPLOADED_FILES_DIR_PATH;
        if(userID!==null){
            uploadDirectory+=`${userID}/`;
            // Check if the user's directory exists, if not, create it
            if(!fs.existsSync(uploadDirectory)){
                fs.mkdirSync(uploadDirectory,{recursive:true});
            }
        }
        return new Promise((resolve)=>{
            // Read the uploaded file as bytes
            fs.readFile(req.file!.path,(err,data)=>{
                if(err){
                    return resolve(null);
                }
                // Define the path where you want to store the file
                const randomName:string=crypto.randomBytes(16).toString('hex');
                const newPath:string=`${uploadDirectory}${randomName}${fileExtension}`;
                // Write the file to the new path
                fs.writeFile(newPath,data,(err)=>{
                    if(err){
                        return resolve(null);
                    }
                    // File saved successfully
                    return resolve(newPath);
                });
            });
        });
    }

}

export default AssetsService;
