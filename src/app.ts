import App from "./core/app/app";
import TestController from "./core/app/controllrers/testController";
import Model from "./core/app/models/Model";
import util from 'util';
import DataOrErrors from "./core/misc/dataOrErrors";
import path from 'path';

class MyApp extends App{

    constructor(){
        super();
    }

    async registerModels(app:App):Promise<void>{
        // console.log('*Registering user model');
        // await Model.registerModel(new Model('user',[
        //     {fieldName:'username',fieldType:'TEXT',options:{},validationFilters:'type:text|required:true'}
        // ]));
        // //
        // console.log('*Inserting new user model');
        // const newID:DataOrErrors<number>=await Model.create('user',{'username':'user1'});
        // const newID2:DataOrErrors<number>=await Model.create('user',{'username':'user2'});
        // if(newID.hasData())console.log(`New inserted user model id: ${newID.data}`);
        // else console.log('Error inserting new user',util.inspect(newID.errors));
        // //
        // console.log('*Getting all user instances');
        // const records:any[]=await Model.getAll('user');
        // for(let key in records){console.log(util.inspect(records[key]))}
        // //
        // console.log('*Updating user');
        // const updateResult:DataOrErrors<boolean>=await Model.update('user',{'username':'moduser1'},1);
        // if(updateResult.hasErrors())console.log('Error updating user instance',util.inspect(updateResult.errors));
        // else console.log("user updated successfully");
        // //
        // console.log('*Getting user by id');
        // const record:any=await Model.getByID('user',1);
        // console.log(util.inspect(record));
        // //
        // console.log("*Deleting user");
        // const deleteResult:DataOrErrors<boolean>=await Model.delete('user',1);
        // if(deleteResult.hasErrors())console.log('Error deleting user instance',util.inspect(deleteResult.errors));
        // else console.log("user deleted successfully");
    }

    async registerRoutes(app:App):Promise<void>{
        TestController.routes(app);
    }

}

export default MyApp;
