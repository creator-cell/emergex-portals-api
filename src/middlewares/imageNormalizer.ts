import { NextFunction, Request,Response } from "express";


export function normalizeImageData(req:Request, res:Response, next:NextFunction) {
  if (req.body.images) {
    req.body.images = req.body.images.map((img:any) => {
      if (/[^\x00-\x7F]/.test(img)) {
        const matches = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(img);
        let mimeType = "image/png";
        let rawData = img;

        if (matches) {
          mimeType = matches[1];
          rawData = img.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
          return img; // Already in base64 data URL format
        }

        // Try to detect mime type from binary header (very basic, extend as needed)
        if (img.startsWith("\xFF\xD8\xFF")) {
          mimeType = "image/jpeg";
        } else if (img.startsWith("\x89PNG")) {
          mimeType = "image/png";
        } else if (img.startsWith("GIF8")) {
          mimeType = "image/gif";
        }

        return `data:${mimeType};base64,${Buffer.from(rawData, 'binary').toString('base64')}`;
      }
      return img;
    });
  }
  
//   if (req.body.signature && /[^\x00-\x7F]/.test(req.body.signature)) {
//     req.body.signature = Buffer.from(req.body.signature, 'binary').toString('base64');
//   }
  
  next();
}