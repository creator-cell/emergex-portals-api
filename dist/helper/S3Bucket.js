"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFile = exports.UploadFile = exports.DeleteFile = exports.UploadBase64File = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../config");
const s3Config = {
    region: config_1.config.aws_region,
    credentials: {
        accessKeyId: config_1.config.aws_access_key,
        secretAccessKey: config_1.config.aws_secret_key
    },
    forcePathStyle: false
};
const S3 = new client_s3_1.S3Client(s3Config);
const getContentTypeFromBase64 = (base64String) => {
    const match = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    return match ? match[1] : 'image/jpeg';
};
const isValidBase64Image = (base64String) => {
    try {
        // Check if it's a valid base64 image string
        const regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
        if (!regex.test(base64String)) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
};
const convertBase64ToBuffer = (base64String) => {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
};
const UploadBase64File = async (base64String, fileName, folderPath = "") => {
    try {
        if (!base64String || !fileName) {
            return { Error: "file and fileName not found", Success: false };
        }
        if (!isValidBase64Image(base64String)) {
            return { Error: "Invalid base64 image format", Success: false };
        }
        const buffer = convertBase64ToBuffer(base64String);
        const contentType = getContentTypeFromBase64(base64String);
        const s3Key = folderPath ? `${folderPath}/${fileName}` : fileName;
        const Params = {
            Bucket: config_1.config.aws_bucket_name,
            Key: s3Key,
            Body: buffer,
            ContentType: contentType
        };
        const Command = new client_s3_1.PutObjectCommand(Params);
        const Response = await S3.send(Command);
        if (Response.$metadata.httpStatusCode !== 200) {
            return { Error: Response.$metadata, Success: false };
        }
        const ImageURl = `https://${config_1.config.aws_bucket_name}.s3.${config_1.config.aws_region}.amazonaws.com/${Params.Key}`;
        return { Success: true, ImageURl: ImageURl };
    }
    catch (Err) {
        console.log(Err);
        return { Error: Err, Success: false };
    }
};
exports.UploadBase64File = UploadBase64File;
const getContentTypeFromFileName = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        case 'pdf':
            return 'application/pdf';
        case 'doc':
            return 'application/msword';
        case 'docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'mp3':
            return 'audio/mpeg';
        case 'wav':
            return 'audio/wav';
        case 'mp4':
            return 'video/mp4';
        case 'mov':
            return 'video/quicktime';
        case 'avi':
            return 'video/x-msvideo';
        default:
            return 'application/octet-stream';
    }
};
const UploadFile = async ({ file, fileName, contentType }) => {
    try {
        if (!file || !fileName) {
            return { Error: "file and fileName are required", Success: false };
        }
        const Params = {
            Bucket: config_1.config.aws_bucket_name,
            Key: fileName,
            Body: file,
            ContentType: contentType || getContentTypeFromFileName(fileName)
        };
        const Command = new client_s3_1.PutObjectCommand(Params);
        const Response = await S3.send(Command);
        if (Response.$metadata.httpStatusCode !== 200) {
            return { Error: Response.$metadata, Success: false };
        }
        const ImageURl = `https://${config_1.config.aws_bucket_name}.s3.${config_1.config.aws_region}.amazonaws.com/${Params.Key}`;
        return { Success: true, ImageURl: ImageURl };
    }
    catch (Err) {
        console.log(Err);
        return { Error: Err, Success: false };
    }
};
exports.UploadFile = UploadFile;
const GetFile = async (FileName) => {
    try {
        if (!FileName) {
            return { Error: "fileName not found", Success: false };
        }
        const Params = {
            Bucket: config_1.config.aws_bucket_name,
            Key: FileName
        };
        const Command = new client_s3_1.GetObjectCommand(Params);
        const Response = await S3.send(Command);
        // console.log(response);
        if (Response.$metadata.httpStatusCode !== 200) {
            return { Success: false, Error: Response.$metadata };
        }
        return { Success: true, Message: "File Get successfully", Data: Response.$metadata };
    }
    catch (Err) {
        console.log(Err);
        return { Success: false, Error: Err };
    }
};
exports.GetFile = GetFile;
const DeleteFile = async (FileName) => {
    try {
        if (!FileName) {
            return { Error: "fileName not found", Success: false };
        }
        const Params = {
            Bucket: config_1.config.aws_bucket_name,
            Key: FileName
        };
        const Command = new client_s3_1.DeleteObjectCommand(Params);
        const Response = await S3.send(Command);
        // console.log(Response);
        if (Response.$metadata.httpStatusCode !== 204) {
            return { Success: false, Error: Response.$metadata };
        }
        return { Success: true, Message: "File Removed successfully" };
    }
    catch (Error) {
        return { Success: false, Error };
    }
};
exports.DeleteFile = DeleteFile;
