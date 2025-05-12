import { Request, Response } from "express";
import AnnouncementModel from "../models/AnnouncementModel";
import TeamModel from "../models/TeamModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import LocationModel from "../models/LocationModel";
import mongoose from "mongoose";
import CountryModel from "../models/CountryModel";
import RegionModel from "../models/RegionModel";
import WorksiteModel from "../models/WorksiteModel";
import { ICustomRequest } from "../types/express";
import { EmailService } from "../services/sendgrid.service";
import { IEmployee } from "../models/EmployeeModel";
import UserModel from "../models/UserModel";

// Create a new announcement
export const createAnnouncement = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { title, description, team, country, worksite, region } = req.body;
    const isExist = await AnnouncementModel.findOne({ title }).session(session);

    if (isExist) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: req.i18n.t(
          "announcementValidationMessages.response.createAnnouncement.titleExist"
        ),
      });
    }

const isTeamExist = await TeamModel.findById(team)
  .populate<{ members: Pick<IEmployee, 'email' | 'name' | 'user'>[] }>([
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
        error: `${req.i18n.t(
          "announcementValidationMessages.response.createAnnouncement.teamNotExist"
        )} ${team}`,
      });
    }

    // console.log("istEam: ",isTeamExist)

    const [isCountryExist, isRegionExist, isWorksiteExist] = await Promise.all([
      CountryModel.exists({ _id: country }).session(session),
      RegionModel.exists({ _id: region }).session(session),
      WorksiteModel.exists({ _id: worksite }).session(session),
    ]);

    if (!isCountryExist || !isRegionExist || !isWorksiteExist) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: `${
          !isCountryExist
            ? `Country: ${country}`
            : !isRegionExist
            ? `Region: ${region}`
            : `Worksite ${worksite}`
        } ${req.i18n.t(
          "announcementValidationMessages.response.createAnnouncement.invalidLocation"
        )}`,
      });
    }

    let location = await LocationModel.findOne({
      country,
      region,
      worksite,
    }).session(session);

    // Create location if not exists
    if (!location) {
      location = await LocationModel.create(
        [
          {
            country,
            region,
            worksite,
          },
        ],
        { session }
      ).then((locations) => locations[0]);
    }

    const announcement = await AnnouncementModel.create(
      [
        {
          title,
          description,
          location: location?._id,
          team,
        },
      ],
      { session }
    ).then((announcements) => announcements[0]);

    await session.commitTransaction();

    const user = await UserModel.findById(currentUser.id).session(session);

    isTeamExist.members.forEach((employee) => {
      if (currentUser.id !== employee.user.toString()) {
        EmailService.sendAnnouncement(
          employee.email,
          // "g82181975@gmail.com",
          employee.name,
          title,
          description,
          user?.firstName ?? ""
        );
      }
    });

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "announcementValidationMessages.response.createAnnouncement.success"
      ),
      announcement,
    });
  } catch (error: any) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "announcementValidationMessages.response.createAnnouncement.server"
      ),
    });
  } finally {
    await session.endSession();
  }
};

// Get all announcements
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const options = getPaginationOptions(req, {
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
    const result = await paginate(AnnouncementModel, options);
    res.status(200).json({
      success: true,
      message: req.i18n.t(
        "announcementValidationMessages.response.getAnnouncements.success"
      ),
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: req.i18n.t(
        "announcementValidationMessages.response.getAnnouncements.server"
      ),
    });
  }
};

// Get a single announcement by ID
export const getAnnouncementById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const announcement = await AnnouncementModel.findById(id);
    if (!announcement) {
      return res.status(200).json({
        success: true,
        message: req.i18n.t(
          "announcementValidationMessages.response.getAnnouncementById.notFound"
        ),
      });
    }
    res.status(200).json({
      success: true,
      message: req.i18n.t(
        "announcementValidationMessages.response.getAnnouncementById.success"
      ),
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: req.i18n.t(
        "announcementValidationMessages.response.getAnnouncementById.server"
      ),
    });
  }
};

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
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedAnnouncement = await AnnouncementModel.findByIdAndUpdate(
      id,
      {
        $set: { isDeleted: true },
      },
      { new: false, runValidators: true }
    );

    if (!deletedAnnouncement) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "announcementValidationMessages.response.deleteAnnouncementById.notFound"
        ),
      });
    }
    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "announcementValidationMessages.response.deleteAnnouncementById.success"
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "announcementValidationMessages.response.deleteAnnouncementById.server"
      ),
    });
  }
};
