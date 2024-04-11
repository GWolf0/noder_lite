import App from "../app/app";
import session from 'express-session';

class SessionService{

    static init(app:App,cookieMaxAge:number=3600000){
        app.app.use(session({
            secret:process.env["SESSION_KEY"]!,
            resave:false,
            saveUninitialized:true,
            cookie:{
                secure:false,
                maxAge:cookieMaxAge,//in ms
            },
            store:new session.MemoryStore({}),
        }));
    }

    //sessions
    static info(req:Express.Request):{sessionID:string,cookie:session.Cookie}{
        return {sessionID:req.sessionID,cookie:req.session.cookie};
    }
    static setSession(req:Express.Request,key:string,value:string){
        req.session.data![key]=value;
    }
    static getSession(req:Express.Request,key:string,defaultValue:string|null=null):string|null{
        return req.session.data![key]||defaultValue;
    }
    static deleteSession(req:Express.Request,key:string){
        delete req.session.data![key];
    }
    static async regenerateSession(req:Express.Request):Promise<boolean>{
        return new Promise((resolve)=>{
            req.session.regenerate((err)=>{
                if(err)console.error("ERROR (SessionSerice): Couldn't regenerate session!");
                resolve(!err);
            });
        });
    }
    static async destroySession(req:Express.Request):Promise<boolean>{
        return new Promise((resolve)=>{
            req.session.destroy((err)=>{
                if(err)console.error("ERROR (SessionSerice): Couldn't destroy session!");
                resolve(!err);
            });
        });
    }

}

export default SessionService;
