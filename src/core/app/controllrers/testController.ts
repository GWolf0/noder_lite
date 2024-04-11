import mw_throttle from "../../middlewares/mw_throttle";
import AssetsService from "../../services/assetsService";
import DBService from "../../services/dbService";
import SessionService from "../../services/sessionService";
import App from "../app";
import Controller from "./controller";

class TestController extends Controller{

    constructor(){
        super("testController");
    }

    static routes(app:App):void{
        app.app.get("/",(req,res)=>{
            return res.status(200).json({sessionInfo:SessionService.info(req)});
        });
        app.app.get("/tables",async (req,res)=>{
            const tablesInfo:any[]=await DBService.getTablesInfos();
            return res.status(200).json({tablesInfo:tablesInfo});
        });
        app.app.get("/upload",(req,res)=>{
            const html:string='<form action="/upload" method="POST" enctype="multipart/form-data">'
            +'<input type="file" name="mfile"/>'
            +'<button type="submit">Submit</button>'
            +'</form>';
            return res.send(html);
        });
        app.app.post('/upload',AssetsService.uploader.single('mfile'),async (req,res)=>{
            const success:string|null=await AssetsService.uploadFile(null,req,[],1024*500);
            if(success===null){
                return res.status(500).send("Error uploading file!");
            }else{
                return res.send("File uploaded successfully!");
            }
        });
        app.app.get('/test_throttle',mw_throttle(1,'test',3),(req,res)=>{
            res.send("Passed throttling!");
        });
    }

}

export default TestController;
