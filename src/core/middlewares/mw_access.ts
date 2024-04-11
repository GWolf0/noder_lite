import { Request,Response,NextFunction } from "express";

export default function(req:Request,res:Response,next:NextFunction){
    // Get the referer from the request header
    const referer=req.get('Referer');
    // If referer exists and does not match your hosted domain, block access
    if(referer&&!referer.includes(process.env.APP_DOMAIN!)){
        return res.status(403).send('Access Forbidden');
    }
    // Allow access for requests with no referer or from your hosted domain
    next();
}