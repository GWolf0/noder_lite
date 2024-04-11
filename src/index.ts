import MyApp from './app.ts';
import App from './core/app/app.ts';

require('dotenv').config();

declare module "express-session"{
    interface SessionData{
        data:{[key:string]:string}
    }
}

const app=new MyApp();
app.run();
