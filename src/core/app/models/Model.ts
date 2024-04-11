import { FieldInfo } from "mysql";
import DataOrErrors from "../../misc/dataOrErrors";
import DBService from "../../services/dbService";
import ValidationService from "../../services/validationService";
import App from "../app";
import util from 'util';

export type ModelFieldType="INTEGER"|"TEXT";
export interface ModelFieldOptions{isPrimaryKey?:boolean,foreignKey?:[from:string,to:string,tableName:string]};
export interface ModelFieldDef{fieldName:string,fieldType:ModelFieldType,options:ModelFieldOptions,validationFilters?:string};

class Model{
    static models:{[modelName:string]:Model}={};

    tableName:string;
    fieldsInfo:ModelFieldDef[];

    constructor(tableName:string,fieldsInfo:ModelFieldDef[]){
        this.tableName=tableName;
        this.fieldsInfo=fieldsInfo;
        if(!Object.keys(Model.models).includes(tableName))Model.models[tableName]=this;
    }

    //get model definition
    static getModelDefinition(tableName:string):Model|null{
        return Object.keys(Model.models).includes(tableName)?Model.models[tableName]:null;
    }

    //register model: Create the model table if does not exists
    static async registerModel(model:Model):Promise<boolean>{
        model.fieldsInfo.push({fieldName:"id",fieldType:"INTEGER",options:{isPrimaryKey:true}});
        let tableColumnsQuery:string=model.fieldsInfo.map((fi,i)=>{
            let s:string=`${fi.fieldName} ${fi.fieldType} ${fi.options.isPrimaryKey?'PRIMARY KEY':''}`;
            return s;
        }).join(", ");
        let foreignKeys:([from:string,to:string,tableName:string])[]=model.fieldsInfo.filter((fi,i)=>fi.options.foreignKey).map((fi,i)=>fi.options.foreignKey!);
        if(foreignKeys.length>0){
            tableColumnsQuery+=foreignKeys.map((fk,i)=>`FOREIGN KEY(${fk[0]}) REFERENCES ${fk[2]}(${fk[1]})`).join(",");
        }
        let query:string=`CREATE TABLE IF NOT EXISTS ${model.tableName} (${tableColumnsQuery});`;
        return await DBService.rawQuery(query);
    }

    //validate model (null= validation ok)
    static validateFields(tableName:string,fields:any):DataOrErrors<boolean>{
        const modelDef:Model|null=Model.getModelDefinition(tableName);
        if(!modelDef)return DataOrErrors.withError('error','Model instance not found!');
        const validationData:[fieldName:string,value:any,filter:string][]=[];
        const fieldsKeys:string[]=Object.keys(fields);
        for(let idx in modelDef.fieldsInfo){
            const fieldName:string=modelDef.fieldsInfo[idx].fieldName;
            const fieldFilters:string|undefined=modelDef.fieldsInfo[idx].validationFilters;
            if(fieldFilters){
                validationData.push([fieldName,fieldsKeys.includes(fieldName)?fields[fieldName]:null,fieldFilters]);
            }
        }
        // const validationData:[fieldName:string,value:any,filter:string][]=Object.entries(fields).map(([key,val],i)=>{
        //     const fieldInfo:ModelFieldDef|undefined=modelDef.fieldsInfo.find((f)=>f.fieldName===key);
        //     const validationFilters:string=fieldInfo&&fieldInfo.validationFilters?fieldInfo.validationFilters:"";
        //     return [key,val,validationFilters];
        // });
        return ValidationService.validateData(validationData);
    }

    //crud
    static async create(tableName:string,fields:{}):Promise<DataOrErrors<number>>{
        const validationResult:DataOrErrors<boolean>=Model.validateFields(tableName,fields);
        if(validationResult.hasErrors())return DataOrErrors.extendErrors<number>(validationResult.errors);
        const insertedID:number|null=await DBService.insertRecord(tableName,fields);
        return new Promise((resolve)=>{
            resolve(insertedID?DataOrErrors.withData(insertedID):DataOrErrors.withError('error',"Couldn't insert object!"));
        });
    }

    static async update(tableName:string,fields:any,id:number):Promise<DataOrErrors<boolean>>{
        const validationResult:DataOrErrors<boolean>=Model.validateFields(tableName,fields);
        if(validationResult.hasErrors())return DataOrErrors.extendErrors<boolean>(validationResult.errors);
        const success:boolean=await DBService.updateRecord(tableName,fields,`where id=${id}`);
        return new Promise((resolve)=>{
            resolve(success?DataOrErrors.withData(true):DataOrErrors.withError('error',`Couldn't update object!`));
        });
    }

    static async delete(tableName:string,id:number):Promise<DataOrErrors<boolean>>{
        const success:boolean=await DBService.deleteRecord(tableName,`where id=${id}`);
        return new Promise((resolve)=>{
            resolve(success?DataOrErrors.withData(true):DataOrErrors.withError('error',`Couldn't delete object!`));
        });
    }

    static async getAll(tableName:string,where:string="where 1=1"):Promise<any[]>{
        const records:any[]=await DBService.selectRecordsWithForeignKeys(tableName,where);
        return new Promise((resolve)=>{
            resolve(records);
        });
    }

    static async getByID(tableName:string,id:number):Promise<any>{
        const records:any[]=await DBService.selectRecordsWithForeignKeys(tableName,`where id=${id}`);
        return new Promise((resolve)=>{
            resolve(records.length>0?records[0]:null);
        });
    }

}

export default Model;
