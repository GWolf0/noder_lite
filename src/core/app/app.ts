import express,{Express} from 'express';
import DBService from '../services/dbService';
import SesskieService from '../services/sessionService';
import AssetsService from '../services/assetsService';
import AuthService from '../services/authService';

abstract class App{
    static PORT:number;static HOST:string;static DB_PATH:string;

    app:Express;

    constructor(){
        App.PORT=Number(process.env["APP_PORT"]!);
        App.HOST=process.env["APP_HOST"]!;
        App.DB_PATH=process.env["DB_PATH"]!;
        this.app=express();
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended:false}));
    }

    async run(){
        //init db service
        const dbOK:boolean=await DBService.init(App.DB_PATH);
        if(!dbOK){
            return console.error("ERROR: (APP): Couldnt' start app!",dbOK);
        }
        //init session/cookie service
        SesskieService.init(this);
        //init assets service
        AssetsService.init();
        //init auth service
        AuthService.init();
        //listen and start
        this.app.listen(App.PORT,App.HOST,()=>this.onStarted());
    }

    onStarted(){
        //register models and routes
        this.registerModels(this);
        this.registerRoutes(this);
        console.info(`App listening on http://${App.HOST}:${App.PORT}/`);
    }

    abstract registerModels(app:App):Promise<void>;
    abstract registerRoutes(app:App):Promise<void>;

}

export default App;
