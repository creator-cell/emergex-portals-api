"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAnnouncement = exports.getAnnouncementById = exports.getAnnouncements = exports.createAnnouncement = void 0;
const AnnouncementModel_1 = __importDefault(require("../models/AnnouncementModel"));
const TeamModel_1 = __importDefault(require("../models/TeamModel"));
const pagination_1 = require("../helper/pagination");
const LocationModel_1 = __importDefault(require("../models/LocationModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const CountryModel_1 = __importDefault(require("../models/CountryModel"));
const RegionModel_1 = __importDefault(require("../models/RegionModel"));
const WorksiteModel_1 = __importDefault(require("../models/WorksiteModel"));
const sendgrid_service_1 = require("../services/sendgrid.service");
const UserModel_1 = __importDefault(require("../models/UserModel"));
// Create a new announcement
const createAnnouncement = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { title, description, team, country, worksite, region } = req.body;
        const isExist = await AnnouncementModel_1.default.findOne({ title }).session(session);
        if (isExist) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: req.i18n.t("announcementValidationMessages.response.createAnnouncement.titleExist"),
            });
        }
        const isTeamExist = await TeamModel_1.default.findById(team)
            .populate([
            {
                path: "members",
                select: 'email name user' // Only populate these fields for efficiency
            },
        ])
            .session(session);
        if (!isTeamExist) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: `${req.i18n.t("announcementValidationMessages.response.createAnnouncement.teamNotExist")} ${team}`,
            });
        }
        // console.log("istEam: ",isTeamExist)
        const [isCountryExist, isRegionExist, isWorksiteExist] = await Promise.all([
            CountryModel_1.default.exists({ _id: country }).session(session),
            RegionModel_1.default.exists({ _id: region }).session(session),
            WorksiteModel_1.default.exists({ _id: worksite }).session(session),
        ]);
        if (!isCountryExist || !isRegionExist || !isWorksiteExist) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: `${!isCountryExist
                    ? `Country: ${country}`
                    : !isRegionExist
                        ? `Region: ${region}`
                        : `Worksite ${worksite}`} ${req.i18n.t("announcementValidationMessages.response.createAnnouncement.invalidLocation")}`,
            });
        }
        let location = await LocationModel_1.default.findOne({
            country,
            region,
            worksite,
        }).session(session);
        // Create location if not exists
        if (!location) {
            location = await LocationModel_1.default.create([
                {
                    country,
                    region,
                    worksite,
                },
            ], { session }).then((locations) => locations[0]);
        }
        const announcement = await AnnouncementModel_1.default.create([
            {
                title,
                description,
                location: location?._id,
                team,
            },
        ], { session }).then((announcements) => announcements[0]);
        await session.commitTransaction();
        const user = await UserModel_1.default.findById(currentUser.id).session(session);
        isTeamExist.members.forEach((employee) => {
            if (currentUser.id !== employee.user.toString()) {
                sendgrid_service_1.EmailService.sendAnnouncement(employee.email, 
                // "g82181975@gmail.com",
                employee.name, title, description, user?.firstName ?? "");
            }
        });
        return res.status(201).json({
            success: true,
            message: req.i18n.t("announcementValidationMessages.response.createAnnouncement.success"),
            announcement,
        });
    }
    catch (error) {
        await session.abortTransaction();
        return res.status(500).json({
            success: false,
            error: req.i18n.t("announcementValidationMessages.response.createAnnouncement.server"),
        });
    }
    finally {
        await session.endSession();
    }
};
exports.createAnnouncement = createAnnouncement;
// Get all announcements
const getAnnouncements = async (req, res) => {
    try {
        const options = (0, pagination_1.getPaginationOptions)(req, {
            populate: [
                {
                    path: "location",
                    populate: [
                        {
                            path: "country region worksite",
                            select: "name",
                        },
                    ],
                },
                {
                    path: "team",
                    select: "name",
                },
            ],
            sort: { createdAt: -1 },
        });
        const result = await (0, pagination_1.paginate)(AnnouncementModel_1.default, options);
        res.status(200).json({
            success: true,
            message: req.i18n.t("announcementValidationMessages.response.getAnnouncements.success"),
            ...result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: req.i18n.t("announcementValidationMessages.response.getAnnouncements.server"),
        });
    }
};
exports.getAnnouncements = getAnnouncements;
// Get a single announcement by ID
const getAnnouncementById = async (req, res) => {
    const { id } = req.params;
    try {
        const announcement = await AnnouncementModel_1.default.findById(id);
        if (!announcement) {
            return res.status(200).json({
                success: true,
                message: req.i18n.t("announcementValidationMessages.response.getAnnouncementById.notFound"),
            });
        }
        res.status(200).json({
            success: true,
            message: req.i18n.t("announcementValidationMessages.response.getAnnouncementById.success"),
            data: announcement,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: req.i18n.t("announcementValidationMessages.response.getAnnouncementById.server"),
        });
    }
};
exports.getAnnouncementById = getAnnouncementById;
// Update an announcement
// export const updateAnnouncement = async (req: Request, res: Response) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { id } = req.params;
//     const { title, description, team, country, region, worksite } = req.body;
//     const existingAnnouncement = await AnnouncementModel
//       .findById(id).populate("location")
//       .session(session);
//     if (!existingAnnouncement) {
//       await session.abortTransaction();
//       return res.status(200).json({
//         success: false,
//         message: req.i18n.t(
//           "announcementValidationMessages.response.updateAnnouncement.notFound"
//         ),
//       });
//     }
//     if (title) {
//       const isExist = await AnnouncementModel.findOne({
//         title,
//         _id: { $ne: id },
//       }).session(session);
//       if (isExist) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           error: req.i18n.t(
//             "announcementValidationMessages.response.updateAnnouncement.titleExist"
//           ),
//         });
//       }
//     }
//    if (team) {
//       const isTeamExist = await TeamModel
//         .findById(team)
//         .session(session);
//       if (!isTeamExist) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           error: `${req.i18n.t(
//             "announcementValidationMessages.response.updateAnnouncement.teamNotExist"
//           )} ${team}`,
//         });
//       }
//     }
//     let locationId = existingAnnouncement.location;
//     if (country || region || worksite) {
//       const [countryExists, regionExists, worksiteExists] = await Promise.all([
//         country ? CountryModel.exists({ _id: country }).session(session) : true,
//         region ? LocationModel.exists({ _id: region }).session(session) : true,
//         worksite ? LocationModel.exists({ _id: worksite }).session(session) : true
//       ]);
//       if (!countryExists || !regionExists || !worksiteExists) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           error: req.i18n.t(
//             "announcementValidationMessages.response.updateAnnouncement.invalidLocation"
//           ),
//         });
//       }
//       const existingLocation = await LocationModel
//         .findOne({
//           country: country || existingAnnouncement.location?.country,
//           region: region || existingAnnouncement.location?.region,
//           worksite: worksite || existingAnnouncement.location?.worksite
//         })
//         .session(session);
//       if (!existingLocation) {
//         const newLocation = await LocationModel.create([{
//           country: country || existingAnnouncement.location?.country,
//           region: region || existingAnnouncement.location?.region,
//           worksite: worksite || existingAnnouncement.location?.worksite
//         }], { session }).then(locations => locations[0]);
//         locationId = newLocation._id;
//       } else {
//         locationId = existingLocation._id;
//       }
//     }
//     const updateData: Partial<IAnnouncement> = {};
//     if (title) updateData.title = title;
//     if (description) updateData.description = description;
//     if (team) updateData.team = team;
//     if (locationId) updateData.location = locationId;
//     const updatedAnnouncement = await AnnouncementModel
//       .findByIdAndUpdate(id, updateData, {
//         new: true,
//         runValidators: true,
//         session
//       })
//       .populate([
//         { path: 'team', select: 'name' },
//         { path: 'location', populate: ['country', 'region', 'worksite'] }
//       ]);
//     await session.commitTransaction();
//     return res.status(200).json({
//       success: true,
//       message: req.i18n.t(
//         "announcementValidationMessages.response.updateAnnouncement.success"
//       ),
//       updatedAnnouncement,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       error: req.i18n.t(
//         "announcementValidationMessages.response.updateAnnouncement.server"
//       ),
//     });
//   }
// };
// Delete an announcement
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAnnouncement = await AnnouncementModel_1.default.findByIdAndUpdate(id, {
            $set: { isDeleted: true },
        }, { new: false, runValidators: true });
        if (!deletedAnnouncement) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("announcementValidationMessages.response.deleteAnnouncementById.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("announcementValidationMessages.response.deleteAnnouncementById.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("announcementValidationMessages.response.deleteAnnouncementById.server"),
        });
    }
};
exports.deleteAnnouncement = deleteAnnouncement;
