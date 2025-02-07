import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

// if (!process.env.ACCESS_KEY || !process.env.SECRET_KEY) {
//     throw new Error("AWS credentials are not defined");

const s3Config = {
    region: config.aws_region as string,
    credentials: {
        accessKeyId: config.aws_access_key as string,
        secretAccessKey: config.aws_secret_key as string
    },
    forcePathStyle: false
}

const S3 = new S3Client(s3Config);

// console.log(s3Config)

// interface UploadFileParams {
//     Bucket: string;
//     Key: string;
//     Body: any;
//     ContentType: string;
// }

// interface UploadFileResponse {
//     Success: boolean;
//     Error?: any;
//     ImageURl?: string;
// }

// const getContentType = (fileName: string): string => {
//     const ext = fileName.toLowerCase().split('.').pop();
//     switch (ext) {
//         case 'jpg':
//         case 'jpeg':
//             return 'image/jpeg';
//         case 'png':
//             return 'image/png';
//         case 'ico':
//             return 'image/x-icon';
//         default:
//             return 'application/octet-stream';
//     }
// };

// const UploadFile = async (File:any, FileName: string): Promise<UploadFileResponse> => {
//     // console.log(File,FileName)
//     try {
//         if (!File || !FileName) {
//             return { Error: "file and fileName not found", Success: false };
//         }

//         const uniqueFileName = `${Date.now()}-${FileName.replace(/[^a-zA-Z0-9.-]/g, '')}`;
//         const Params: UploadFileParams = {
//             Bucket: config.aws_bucket_name as string,
//             Key: uniqueFileName,
//             Body: File,
//             ContentType: getContentType(FileName)
//         };

//         const Command = new PutObjectCommand(Params);
//         console.log("com: ",Command);
//         const Response = await S3.send(Command);
//         console.log("Response: ", Response);
//         if (Response.$metadata.httpStatusCode !== 200) {
//             return { Error: Response.$metadata, Success: false };
//         }
//         const ImageURl = `https://${config.aws_bucket_name}.${config.aws_region}.s3.amazonaws.com/${Params.Key}`;
//         return { Success: true, ImageURl: ImageURl };
//     } catch (Err) {
//         console.log("error in uploading img: ",Err);
//         return { Success: false, Error: Err };
//     }
// }

interface UploadFileResponse {
    Success: boolean;
    Error?: any;
    ImageURl?: string;
}

const getContentTypeFromBase64 = (base64String: string): string => {
    const match = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    return match ? match[1] : 'image/jpeg';
};

const isValidBase64Image = (base64String: string): boolean => {
    try {
        // Check if it's a valid base64 image string
        const regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
        if (!regex.test(base64String)) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
};

const convertBase64ToBuffer = (base64String: string): Buffer => {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
};

const UploadBase64File = async (base64String: string, fileName: string): Promise<UploadFileResponse> => {
    try {
        if (!base64String || !fileName) {
            return { Error: "file and fileName not found", Success: false };
        }

        if (!isValidBase64Image(base64String)) {
            return { Error: "Invalid base64 image format", Success: false };
        }

        const buffer = convertBase64ToBuffer(base64String);
        const contentType = getContentTypeFromBase64(base64String);

        const Params = {
            Bucket: config.aws_bucket_name as string,
            Key: fileName,
            Body: buffer,
            ContentType: contentType
        };

        const Command = new PutObjectCommand(Params);
        const Response = await S3.send(Command);

        if (Response.$metadata.httpStatusCode !== 200) {
            return { Error: Response.$metadata, Success: false };
        }

        const ImageURl = `https://${config.aws_bucket_name}.s3.${config.aws_region}.amazonaws.com/${Params.Key}`;
        return { Success: true, ImageURl: ImageURl };
    } catch (Err) {
        console.log(Err);
        return { Error: Err, Success: false };
    }
};

interface GetFileParams {
    Bucket: string;
    Key: string;
}

interface GetFileResponse {
    Success: boolean;
    Error?: any;
    Message?: string;
    Data?: any;
}

const GetFile = async (FileName: string): Promise<GetFileResponse> => {
    try {
        if (!FileName) {
            return { Error: "fileName not found", Success: false };
        }
        const Params: GetFileParams = {
            Bucket: config.aws_bucket_name as string,
            Key: FileName
        }
        const Command = new GetObjectCommand(Params);
        const Response = await S3.send(Command);
        // console.log(response);
        if (Response.$metadata.httpStatusCode !== 200) {
            return { Success: false, Error: Response.$metadata }
        }
        return { Success: true, Message: "File Get successfully", Data: Response.$metadata }
    } catch (Err) {
        console.log(Err);
        return { Success: false, Error: Err };
    }
}

interface DeleteFileResponse {
    Success: boolean;
    Error?: any;
    Message?: string;
}

const DeleteFile = async (FileName: string): Promise<DeleteFileResponse> => {
    try {
        if (!FileName) {
            return { Error: "fileName not found", Success: false };
        }
        const Params = {
            Bucket: config.aws_bucket_name as string,
            Key: FileName
        }
        const Command = new DeleteObjectCommand(Params);
        const Response = await S3.send(Command);
        // console.log(Response);
        if (Response.$metadata.httpStatusCode !== 204) {
            return { Success: false, Error: Response.$metadata }
        }
        return { Success: true, Message: "File Removed successfully" }
    } catch (Error) {
        return { Success: false, Error };
    }
}

export {
    UploadBase64File,
    DeleteFile,
    GetFile
}