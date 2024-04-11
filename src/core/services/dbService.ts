import sqlite3, { Database } from 'sqlite3';

class DBService{
    static dbName:string;
    static db:sqlite3.Database;

    static initialDBQueries:string[]=["CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, username TEXT, email TEXT, password TEXT);"
    ,"CREATE TABLE IF NOT EXISTS user_meta (user_id INTEGER, ip TEXT, membership INTEGER, assets_size INTEGER, FOREIGN KEY(user_id) REFERENCES user(id));"
    ,"CREATE TABLE IF NOT EXISTS throttle (user_id INTEGER, action_name TEXT, action_count INTEGER, updated_at TEXT, FOREIGN KEY(user_id) REFERENCES user(id))"
    ];

    static async init(dbName:string):Promise<boolean>{
        DBService.dbName=dbName;
        return await DBService.start();
    }

    static async start():Promise<boolean>{
        return new Promise((resolve)=>{
            DBService.db=new sqlite3.Database(DBService.dbName,async (err)=>{
                if(err)return resolve(false);
                const initialized=await DBService.onStarted();
                resolve(initialized);
            });
        })
    }

    static async onStarted():Promise<boolean>{
        await DBService.clearDBData();
        for(let i in DBService.initialDBQueries){
            const success:boolean=await DBService.rawQuery(DBService.initialDBQueries[i]);
            if(!success)return false;
        }
        console.log(`Connected to Database ${DBService.dbName}`);
        return true;
    }

    //ops
        //global
    static async rawQuery(query:string,params:any[]|null=null):Promise<boolean>{
        params=params||[];
        return new Promise((resolve)=>{
            DBService.db.run(query,params,(err)=>{
                if(err)console.error(`ERROR: (DBService): ${err}, query: ${query}`);
                resolve(!err);
            });
        });
    }
        //for tables
    static createTable(tableName:string,columns:string[]){
        const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')});`;
        DBService.db.run(query, (err) => {
            if (err) console.error(`ERROR: (DBService): ${err}`);
            else console.log(`Table ${tableName} created successfully.`);
        });
    }
    static updateTable(tableName:string,columnDefinitions: string[]){
        const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnDefinitions.join(', ADD COLUMN ')};`;
        DBService.db.run(query, (err) => {
            if (err) console.error(`ERROR: (DBService): ${err}`);
            else console.log(`Table ${tableName} updated successfully.`);
        });
    }
    static deleteTable(tableName:string){
        const query = `DROP TABLE IF EXISTS ${tableName};`;
        DBService.db.run(query, (err) => {
            if (err) console.error(`ERROR: (DBService): ${err}`);
            else console.log(`Table ${tableName} deleted successfully.`);
        });
    }
        //for records
    static async insertRecord(tableName:string,record:any):Promise<number|null>{
        return new Promise((resolve, reject) => {
            const placeholders = Object.keys(record).map(() => '?').join(',');
            const keys = Object.keys(record);
            const values = Object.values(record);
            const query = `INSERT INTO ${tableName}(${keys}) VALUES (${placeholders})`;
            // console.log(`insert query ${query}, values: ${values}`)
            DBService.db.run(query, values, function (err) {
                if (err) {
                    console.error(`ERROR: (DBService): ${err}`);
                    resolve(null);
                } else {
                    console.log(`Inserted record with ID: ${this.lastID}`);
                    resolve(this.lastID);
                }
            });
        });
    }
    static async selectRecords(tableName:string,conditions:string='',params:any[]|null=null):Promise<any[]>{
        params=params||[];
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM ${tableName} ${conditions};`;
            DBService.db.all(query,params,(err, rows) => {
                if (err) {
                    console.error(`ERROR: (DBService): ${err} ,query: ${query}`);
                    resolve([]);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    static async selectRecordsWithForeignKeys(tableName:string,conditions:string='',params:any[]|null=null):Promise<any[]>{
        params=params||[];
        return new Promise((resolve,reject)=>{
            const query=`SELECT * FROM ${tableName} ${conditions};`;
            DBService.db.all(query,params,async(err,rows)=>{
                if(err){
                    console.error(`ERROR: (DBService): ${err}`);
                    resolve([]);
                }else{
                    // Identify foreign key columns and fetch related records
                    const foreignKeyColumns=await DBService.getForeignKeyColumns(tableName);
                    const relatedRecords=await Promise.all(foreignKeyColumns.map(async (column)=>{
                        const relatedTable=column.foreignTable;
                        const relatedPrimaryKey=column.foreignKey;
                        const relatedRecords=await DBService.selectRecords(relatedTable);
                        return {column:column.name,relatedRecords};
                    }));
                    // Replace foreign key values with related records
                    rows.forEach(row=>{
                        let _row=row as {[key:string]:any}
                        relatedRecords.forEach(relatedRecord=>{
                            const columnName=relatedRecord.column;
                            const foreignKeyValue=_row[columnName];
                            const relatedRecordValue=relatedRecord.relatedRecords.find(record=>record.id===foreignKeyValue);
                            _row[columnName]=relatedRecordValue;
                        });
                    });
    
                    resolve(rows);
                }
            });
        });
    }
    static async updateRecord(tableName:string,record:any,conditions:string='',params:any[]|null=null):Promise<boolean>{
        params=params||[];
        return new Promise((resolve,reject)=>{
            const setValues=Object.entries(record).map(([key, value])=>`${key}=?`).join(', ');
            params=[...Object.values(record),...params!];
            const query=`UPDATE ${tableName} SET ${setValues} ${conditions};`;
            DBService.db.run(query,params, function (err){
                if (err) {
                    console.error(`ERROR: (DBService): ${err}`);
                    resolve(false);
                } else {
                    console.log(`Updated ${this.changes} record(s)`);
                    resolve(true);
                }
            });
        });
    }
    static async deleteRecord(tableName:string,conditions:string,params:any[]|null=null):Promise<boolean>{
        params=params||[];
        return new Promise((resolve, reject) => {
            const query=`DELETE FROM ${tableName} ${conditions};`;
            DBService.db.run(query,params,function(err){
                if (err) {
                    console.error(`ERROR: (DBService): ${err}`);
                    resolve(false);
                } else {
                    console.log(`Deleted ${this.changes} record(s)`);
                    resolve(true);
                }
            });
        });
    }

    //info queries
    static async getForeignKeyColumns(tableName:string):Promise<any[]>{
        return new Promise((resolve,reject)=>{
            DBService.db.all(`PRAGMA foreign_key_list(${tableName});`,(err,rows)=>{
                if(err){
                    console.error(`ERROR: (DBService): ${err}`);
                    resolve([]);
                }else{
                    const foreignKeyColumns=rows.map(row=>{
                        let _row=row as {[key:string]:any}
                        return ({
                            name:_row.from,
                            foreignTable:_row.table,
                            foreignKey:_row.to
                        })
                    });
                    resolve(foreignKeyColumns);
                }
            });
        });
    }
    static async getTablesInfos(tableName:string|null=null):Promise<any[]>{
        return await DBService.selectRecords(`sqlite_master","WHERE type='table'${tableName?` AND name='${tableName}'`:''};`);
    }

    //other queries
    static async clearDBData():Promise<boolean>{
        const tables:any[]=(await DBService.getTablesInfos()).map((tableInfo)=>tableInfo["name"]);
        if(tables.length===0)return true;
        const query:string=tables.map((table)=>`DROP TABLE ${table}`).join("; ");
        return new Promise((resolve)=>{
            DBService.db.run(`${query};`,(err)=>{
                if(err)console.error(`ERROR: (DBService): ${err}, query :${query}`);
                resolve(!err);
            });
        });
    }

}

export default DBService;
