import App from "../app"; 

abstract class Controller{
    name:string;

    constructor(name:string){
        this.name=name;
    }

}

export default Controller;
