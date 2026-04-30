import { Request, Response } from "express";
import WorksiteModel from "../models/WorksiteModel";
import RegionModel from "../models/RegionModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import CountryModel from "../models/CountryModel";
import mongoose from "mongoose";
import { ICustomRequest } from "../types/express";
import UserModel from "../models/UserModel";

export const addWorksite = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: "User is not associated with any company",
      });
    }

    const { name, regionId } = req.body;

    const isExist = await WorksiteModel.findOne({ name, region: regionId, companyId });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t("worksiteValidationMessages.response.workSiteExist"),
      });
    }

    const isRegionExist = await RegionModel.findOne({ _id: regionId, companyId });
    if (!isRegionExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t("regionValidationMessages.response.regionNotExist"),
      });
    }

    const worksite = new WorksiteModel({ name, region: regionId, companyId });
    await worksite.save();

    return res.status(201).json({
      success: true,
      message: req.i18n.t("worksiteValidationMessages.response.addWorksite.success"),
      data: worksite,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t("worksiteValidationMessages.response.addWorksite.server"),
    });
  }
};

export const getAllWorksites = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: "User is not associated with any company",
      });
    }

    const options = getPaginationOptions(req, {
      populate: [
        {
          path: "region",
          populate: [{
              path: "country",
          }]
        },
      ],
      filter: { companyId },
    });
    const worksites = await paginate(WorksiteModel, options);

    return res.status(200).json({
      success: true,
      message:  req.i18n.t("worksiteValidationMessages.response.getAllWorksites.success"),
      ...worksites,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("worksiteValidationMessages.response.getAllWorksites.server"),
    });
  }
};

export const getWorksitesByRegion = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: "User is not associated with any company",
      });
    }

    const { id } = req.params;

    const isRegionExist = await RegionModel.findOne({ _id: id, companyId });
    if (!isRegionExist) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("regionValidationMessages.response.regionNotExist"),
      });
    }

    const options = getPaginationOptions(req, {
      populate: [
        {
          path: "region",
          populate: [{
              path: "country",
          }]
        },
      ],
      filter: { region: id, companyId, isDeleted: false },
    });
    const worksites = await paginate(WorksiteModel, options);

    if (!worksites.data.length) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("worksiteValidationMessages.response.getWorksitesByRegion.notFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message:  req.i18n.t("worksiteValidationMessages.response.getWorksitesByRegion.success"),
      ...worksites
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:  req.i18n.t("worksiteValidationMessages.response.getWorksitesByRegion.server")
    });
  }
};

export const updateWorksiteById = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: "User is not associated with any company",
      });
    }

    const { id } = req.params;
    const { name, regionId } = req.body;

    const worksite = await WorksiteModel.findOne({ _id: id, companyId });
    if (!worksite) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("worksiteValidationMessages.response.notFound"),
      });
    }

    if (name && regionId) {
      const isExist = await WorksiteModel.findOne({
        name,
        region: regionId,
        companyId,
        _id: { $ne: id },
      });

      if (isExist) {
        return res.status(400).json({
          success: false,
          message:
          req.i18n.t("worksiteValidationMessages.response.workSiteExistInRegion"),
        });
      }
    }

    if (regionId) {
      const isRegionExist = await RegionModel.findOne({ _id: regionId, companyId });
      if (!isRegionExist) {
        return res.status(400).json({
          success: false,
          message: req.i18n.t("regionValidationMessages.response.regionNotExist"),
        });
      }
    }

    const updatedFields: Partial<typeof worksite> = {};
    if (name) updatedFields.name = name;
    if (regionId) updatedFields.region = regionId;

    const updatedWorksite = await WorksiteModel.findOneAndUpdate(
      { _id: id, companyId },
      updatedFields,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: req.i18n.t("worksiteValidationMessages.response.updateWorksiteById.success"),
      data: updatedWorksite,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("worksiteValidationMessages.response.updateWorksiteById.server"),
    });
  }
};

export const getWorksiteById = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: "User is not associated with any company",
      });
    }

    const { id } = req.params;

    const worksite = await WorksiteModel.findOne({ _id: id, companyId }).populate({
      path:"region",
      populate: {
        path:"country"
      }
    })

    if (!worksite) {
      return res.status(200).json({
        success: false,
        message: "Worksite not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Worksite fetched successfully",
      data: worksite,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching worksite",
      error,
    });
  }
};

export const deleteWorksiteById = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: "User is not associated with any company",
      });
    }

    const { id } = req.params;

    const worksite = await WorksiteModel.findOneAndUpdate(
      { _id: id, companyId },
      { isDeleted: true },
      { new: true }
    );

    if (!worksite) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("worksiteValidationMessages.response.worksiteNotFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t("worksiteValidationMessages.response.deleteWorksiteById.success"),
      data: worksite,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting worksite",
      error:req.i18n.t("worksiteValidationMessages.response.deleteWorksiteById.success"),
    });
  }
};

export const addCountryRegionWorksites = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await UserModel.findById(currentUser.id);
    const companyId = user?.companyId;

    if (!companyId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "User is not associated with any company",
      });
    }

    const { country, region, worksites } = req.body;
    let isCountryExist = false;
    let isRegionExist = false;
    let countryDoc;
    let regionDoc;

    const existingCountry = await CountryModel.findOne({
      name: { $regex: `^${country}$`, $options: 'i' },
      companyId,
    }).session(session);

    if (existingCountry) {
      isCountryExist = true;
      countryDoc = existingCountry; 
    } else {
      const createdCountry = await CountryModel.create([{ name: country, companyId }], { session });
      countryDoc = createdCountry[0];
    }

    const existingRegion = await RegionModel.findOne({
      name: { $regex: `^${region}$`, $options: 'i' },
      country: countryDoc._id,
      companyId,
    }).session(session);

    if (existingRegion) {
      isRegionExist = true;
      regionDoc = existingRegion;
    } else {
      const createdRegion = await RegionModel.create(
        [{ name: region, country: countryDoc._id, companyId }],
        { session }
      );
      regionDoc = createdRegion[0]; 
    }

    const notExistWorksites = [];
    for (const worksite of worksites) {
      const existingWorksite = await WorksiteModel.findOne({
        name: { $regex: `^${worksite}$`, $options: 'i' },
        region: regionDoc._id,
        companyId,
      }).session(session);

      if (!existingWorksite) {
        notExistWorksites.push(worksite);
      }
    }

    if (notExistWorksites.length > 0) {
      const worksiteDocs = notExistWorksites.map((worksite: string) => ({
        name: worksite,
        region: regionDoc._id,
        companyId,
      }));
      await WorksiteModel.insertMany(worksiteDocs, { session });
    }

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: 'Country, region, and worksites created successfully.',
      details: {
        country: isCountryExist ? 'Existing' : 'Created',
        region: isRegionExist ? 'Existing' : 'Created',
        worksites: notExistWorksites.length ? 'Some created' : 'All existing',
      },
    });
  } catch (error: any) {
    await session.abortTransaction();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  finally{
    session.endSession();
  }
};



