class DataOrErrors<T>{
    data?:T;
    errors:{[key:string]:string};

    constructor(){
        this.errors={};
    }

    static withErrors<T>(errors:[errorKey:string,errorMsg:string][]):DataOrErrors<T>{
        const instance:DataOrErrors<T>=new DataOrErrors();
        instance.addErrors(errors);
        return instance;
    }
    static withError<T>(errorKey:string,errorMsg:string):DataOrErrors<T>{
        const instance:DataOrErrors<T>=new DataOrErrors();
        instance.addErrors([[errorKey,errorMsg]]);
        return instance;
    }
    static extendErrors<T>(errors:{[key:string]:string},errorKey:string|null=null,errorMsg:string|null=null):DataOrErrors<T>{
        const instance:DataOrErrors<T>=new DataOrErrors();
        instance.addErrors(Object.entries(errors).map(([key,val])=>[key,val]));
        if(errorKey&&errorMsg)instance.addErrors([[errorKey,errorMsg]]);
        return instance;
    }
    static withData<T>(data:T):DataOrErrors<T>{
        const instance:DataOrErrors<T>=new DataOrErrors();
        instance.setData(data);
        return instance;
    }

    hasErrors():boolean{
        return Object.keys(this.errors).length>0;
    }
    
    hasData():boolean{
        return this.data!==undefined;
    }

    addErrors(errors:[errorKey:string,errorMsg:string][]){
        for(let idx in errors){
            this.errors[errors[idx][0]]=errors[idx][1];
        }
    }

    setData(data:T){
        this.data=data;
    }

}

export default DataOrErrors;
