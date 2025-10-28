import fs from "fs";
import PdfPrinter from "pdfmake";
import { UploadBufferToS3 } from "./S3Bucket";
import { Types } from "mongoose";

// ---------- Types ----------
interface Employee {
    _id: Types.ObjectId;
    name: string;
    _v?: number;
}

interface Role {
    _id: Types.ObjectId;
    employee?: Employee;
    _v?: number;
}

interface Project {
    _id: Types.ObjectId | string;
    id: string;
    location: {
        country: { name: string },
        region: { name: string },
        worksite: { name: string }
    };
    parentProjectId: Types.ObjectId | string | null;
    name: string;
    description: string;
    createdBy: Types.ObjectId | string;
    isDeleted: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    __v?: number;
}

export interface Incident {
    _id: Types.ObjectId;
    id: string;
    project: Project
    description: string;
    status: string;
    location: string;
    countOfTotalPeople: number;
    countOfInjuredPeople: number;
    finance: string;
    damageAssets: string[];
    utilityAffected: string[];
    image?: string[];
    signature?: string;
    createdAt: string;
    updatedAt: string;
    isApproved: boolean;
    isNearMiss: boolean;
    approvedAt?: string;
    isStopped: boolean;
    stoppedTime?: string;
    _v?: string;
}

interface IncidentHistory {
    _id: Types.ObjectId;
    title: string;
    createdAt: string;
    role?: Role;
}

interface StatusHistory {
    _id: Types.ObjectId;
    status: string;
    createdAt: string;
    role?: Role;
    _v?: number;
}

interface Payload {
    incident: Incident;
    incidentHistory: IncidentHistory[];
    statustHistory: StatusHistory[];
}

const sectionHeader = (doc: PDFKit.PDFDocument, title: string) => {
    doc.moveDown(1);
    doc.fontSize(14).fillColor("#003366").text(title, { underline: true });
    doc.moveDown(0.3);
    doc.fillColor("black");
};

const formatDate = (
    input?: string,
    options: { time?: boolean; date?: boolean } = { time: true, date: true }
): string => {
    if (!input) return "N/A";
    const d = new Date(input);

    const { time, date } = options;

    if (date && time) {
        return d.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    }

    if (!time) {
        return d.toLocaleDateString("en-IN", { dateStyle: "medium" });
    }

    if (!date) {
        return d.toLocaleTimeString("en-IN", { timeStyle: "short" });
    }

    return "N/A";
};

const getDuration = (start?: string, end?: string): string => {
    if (!start || !end) return "N/A";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return "N/A";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};



export const generateAndUploadReport = async (payload: Payload): Promise<string> => {
    const { incident, incidentHistory, statustHistory } = payload;

    let docDefinition: any = {
        pageMargins: [40, 60, 40, 50],
        defaultStyle: {
            font: 'Helvetica'
        },
        content: [
            {
                text: `Report of Emerge-x Case - ${incident.project.name} - ${incident.id}`,
                style: "header",
                alignment: "center",
                lineHeight: 1.5,
                margin: [0, 0, 0, 20],
            },

            {
                text: "Incident Details",
                style: "sectionHeader",
            },
            {
                style: "table",
                table: {
                    widths: ["40%", "60%"],
                    body: [
                        ["Case Number", incident.id],
                        ["Date", formatDate(incident.createdAt)],
                        ["Case Categorisation", incident.isNearMiss ? 'Near Miss' : incident.isApproved ? 'Approval' : 'Normal'],
                        ["Business Unit", `${incident?.project?.location?.country?.name}, ${incident?.project?.location?.region?.name}, ${incident?.project?.location?.worksite?.name}`],
                        ["Location", incident.location],
                        ["Client/Project", incident.project.name],
                        ["Status", incident.status ?? 'Completed'],
                        ["Total People", incident?.countOfTotalPeople?.toString() ?? '0'],
                        ["Injured People", incident?.countOfInjuredPeople?.toString() ?? '0'],
                        ["Finance", incident?.finance ? `${incident.finance}` : '0'],
                        ["Case Completion Date", formatDate(incident.stoppedTime, { time: false })],
                        ["Case Completion Time", incident?.approvedAt ? getDuration(incident.approvedAt, incident.stoppedTime) : "N/A"],
                    ],
                },
                layout: {
                    hLineWidth: function () {
                        return 1;
                    },
                    vLineWidth: function () {
                        return 1;
                    },
                    hLineColor: function () {
                        return "#000000";
                    },
                    vLineColor: function () {
                        return "#000000";
                    },
                    paddingLeft: function () {
                        return 8;
                    },
                    paddingRight: function () {
                        return 8;
                    },
                    paddingTop: function () {
                        return 5;
                    },
                    paddingBottom: function () {
                        return 5;
                    },
                },
            },
            {
                text: "Incident Description",
                style: "sectionHeader",
            },
            {
                text: incident?.description || "No description available.",
                margin: [0, 5, 0, 15],
                fontSize: 12,
                lineHeight: 1.5,
            },
            {
                text: "Actions Taken",
                style: "sectionHeader",
            },
            {
                style: "table",
                table: {
                    widths: ["50%", "20%", "30%"],
                    body: [
                        [
                            { text: "Action Taken", bold: true },
                            { text: "Responsible", bold: true },
                            { text: "Completion Date & Time", bold: true },
                        ],
                        ...incidentHistory?.map((log) => [log.title, log.role?.employee?.name, formatDate(log.createdAt)])
                    ],
                },
                layout: {
                    hLineWidth: function () {
                        return 1;
                    },
                    vLineWidth: function () {
                        return 1;
                    },
                    hLineColor: function () {
                        return "#000000";
                    },
                    vLineColor: function () {
                        return "#000000";
                    },
                    paddingLeft: function () {
                        return 8;
                    },
                    paddingRight: function () {
                        return 8;
                    },
                    paddingTop: function () {
                        return 5;
                    },
                    paddingBottom: function () {
                        return 5;
                    },
                },
                margin: [0, 0, 0, 10],
                lineHeight: 1.5
            },


            {
                text: "Damage & Utility Impact",
                style: "sectionHeader",
            },
            {
                ul: [
                    `Damaged Assets: ${incident.damageAssets.length > 0 ? incident.damageAssets?.map(asset => `${asset} `) : 'None'}`,
                    `Utilities Affected: ${incident.utilityAffected.length > 0 ? incident.utilityAffected?.map(util => `${util} `) : 'None'}`
                ],
                fontSize: 12,
                lineHeight: 1.6,
                margin: [0, 5, 0, 15],
            },

            {
                text: "Case Processing Timeline",
                style: "sectionHeader",
            },
            {
                style: "table",
                table: {
                    widths: ["40%", "30%", "30%"],
                    body: [
                        [
                            { text: "Steps", bold: true },
                            { text: "Responsible", bold: true },
                            { text: "Date & Time", bold: true },
                        ],
                        ...statustHistory?.map(log => [log.status, log.role?.employee?.name, formatDate(log.createdAt)])
                    ],
                },
                layout: {
                    hLineWidth: function () {
                        return 1;
                    },
                    vLineWidth: function () {
                        return 1;
                    },
                    hLineColor: function () {
                        return "#000000";
                    },
                    vLineColor: function () {
                        return "#000000";
                    },
                    paddingLeft: function () {
                        return 8;
                    },
                    paddingRight: function () {
                        return 8;
                    },
                    paddingTop: function () {
                        return 5;
                    },
                    paddingBottom: function () {
                        return 5;
                    },
                },
                margin: [0, 0, 0, 10],
            }
        ],

        styles: {
            header: {
                fontSize: 20,
                bold: true,
                color: "#1a237e",
            },
            sectionHeader: {
                fontSize: 14,
                bold: true,
                color: "#1565c0",
                margin: [0, 15, 0, 5],
            },
            table: {
                margin: [0, 0, 0, 10],
                fontSize: 11,
            },
        },
    };

    var fonts = {
        Courier: {
            normal: 'Courier',
            bold: 'Courier-Bold',
            italics: 'Courier-Oblique',
            bolditalics: 'Courier-BoldOblique'
        },
        Helvetica: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
        },
        Times: {
            normal: 'Times-Roman',
            bold: 'Times-Bold',
            italics: 'Times-Italic',
            bolditalics: 'Times-BoldItalic'
        },
        Symbol: {
            normal: 'Symbol'
        },
        ZapfDingbats: {
            normal: 'ZapfDingbats'
        }
    };


    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: any[] = [];

    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    const fileName = `${incident.id}_${Date.now()}.pdf`;

    const pdfBuffer: Buffer = await new Promise((resolve) => {
        pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
        pdfDoc.end();
    });

    // ---------- Upload to S3 ----------
    const fileUrl = await UploadBufferToS3(pdfBuffer, fileName);
    return fileUrl;
};
