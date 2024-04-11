import DataOrErrors from "../misc/dataOrErrors";

class ValidationService{

    static validateText(value: any, minLength?: number, maxLength?: number): string|null {
        let res=true;
        if (typeof value !== 'string') res=false;
        if (minLength !== undefined && value.length < minLength) res=false;
        if (maxLength !== undefined && value.length > maxLength) res=false;
        return res?null:"Invalid text value!";
    }
    static validateNumber(value: any, minLength?: number, maxLength?: number): string|null {
        let res=true;
        if (typeof value !== 'number' || isNaN(value)) res=false;
        if (minLength !== undefined && value < minLength) res=false;
        if (maxLength !== undefined && value > maxLength) res=false;
        return res?null:`Invalid number!`;
    }
    static validateEmail(emailValue: string): string|null {
        // Add your email validation logic here
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailValue)?null:"Invalid email!";
    }

    static validate(data: any,required: boolean, type: string, minLength?: number, maxLength?: number): string|null {
        if(required&&data===null)return `Required value!`;
        switch (type) {
            case 'text':
                return this.validateText(data, minLength, maxLength);
            case 'number':
                return this.validateNumber(data, minLength, maxLength);
            case 'email':
                return this.validateEmail(data.toString());
            // Add cases for other types as needed
            default:
                return `Unsupported value!`; // Unsupported type
        }
    }

    //(null= validation ok)
    static validateData(data:[fieldName:string,value:any,filters:string][]):DataOrErrors<boolean>{
        for(let idx in data){
            const fieldName:string=data[idx][0];
            const value:any=data[idx][1];
            const filters:string[]=data[idx][2].split("|");
            let type:string="string";
            let minLength:number=0;
            let maxLength:number=1024;
            let required:boolean=false;
            for(let idx in filters){
                const filter:string=filters[idx];
                const pair:string[]=filter.split(":");
                if(pair.length===2){
                    if(pair[0]==="type")type=pair[1];
                    else if(pair[0]==="required")required=pair[1]==="true";
                    else if(pair[0]==="min")minLength=Number(pair[1]);
                    else if(pair[0]==="max")maxLength=Number(pair[1]);
                }
            }
            const validationRes:null|string=ValidationService.validate(value,required,type,minLength,maxLength);
            if(typeof validationRes==="string"){
                return DataOrErrors.withError(fieldName,validationRes);
            }
        }
        return DataOrErrors.withData<boolean>(true);
    }

}

export default ValidationService;
