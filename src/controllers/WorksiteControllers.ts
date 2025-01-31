import { Request, Response } from "express";
import WorksiteModel from "../models/WorksiteModel";
import RegionModel from "../models/RegionModel";
import path from "path";
import { getPaginationOptions, paginate } from "../helper/pagination";
import CountryModel from "../models/CountryModel";
import mongoose from "mongoose";

export const addWorksite = async (req: Request, res: Response) => {
  try {
    const { name, regionId } = req.body;

    const isExist = await WorksiteModel.findOne({ name, region: regionId });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t("worksiteValidationMessages.response.workSiteNotExist"),
      });
    }

    const isRegionExist = await RegionModel.findById(regionId);
    if (!isRegionExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t("regionValidationMessages.response.regionNotExist"),
      });
    }

    const worksite = new WorksiteModel({ name, region: regionId });
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
  try {
    const options = getPaginationOptions(req, {
      populate: [
        {
          path: "region",
          populate: [{
              path: "country",
          }]
        },
      ],
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
  const { id } = req.params;
  try {
    const options = getPaginationOptions(req, {
      populate: [
        {
          path: "region",
          populate: [{
              path: "country",
          }]
        },
      ],
      filter: { region: id,isDeleted:false },
    });
    const worksites = await paginate(WorksiteModel, options);

    if (!worksites.data.length) {
      return res.status(404).json({
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
      error:  req.i18n.t("worksiteValidationMessages.response.getWorksitesByRegion.server") + id
    });
  }
};

export const updateWorksiteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, regionId } = req.body;

    const worksite = await WorksiteModel.findById(id);
    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: req.i18n.t("worksiteValidationMessages.response.notFound"),
      });
    }

    if (name && regionId) {
      const isExist = await WorksiteModel.findOne({
        name,
        region: regionId,
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
      const isRegionExist = await RegionModel.findById(regionId);
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

    const updatedWorksite = await WorksiteModel.findByIdAndUpdate(
      id,
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
  try {
    const { id } = req.params;

    const worksite = await WorksiteModel.findById(id).populate({
      path:"region",
      populate: {
        path:"country"
      }
    })

    if (!worksite) {
      return res.status(404).json({
        success: false,
        message: "Worksite not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Worksite deleted successfully",
      data: worksite,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting worksite",
      error,
    });
  }
};

export const deleteWorksiteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const worksite = await WorksiteModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!worksite) {
      return res.status(404).json({
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { country, region, worksites } = req.body;
    let isCountryExist = false;
    let isRegionExist = false;
    let countryDoc;
    let regionDoc;

    const existingCountry = await CountryModel.findOne({
      name: { $regex: `^${country}$`, $options: 'i' },
    }).session(session);

    if (existingCountry) {
      isCountryExist = true;
      countryDoc = existingCountry; 
    } else {
      const createdCountry = await CountryModel.create([{ name: country }], { session });
      countryDoc = createdCountry[0];
    }

    const existingRegion = await RegionModel.findOne({
      name: { $regex: `^${region}$`, $options: 'i' },
      country: countryDoc._id,
    }).session(session);

    if (existingRegion) {
      isRegionExist = true;
      regionDoc = existingRegion;
    } else {
      const createdRegion = await RegionModel.create(
        [{ name: region, country: countryDoc._id }],
        { session }
      );
      regionDoc = createdRegion[0]; 
    }

    const notExistWorksites = [];
    for (const worksite of worksites) {
      const existingWorksite = await WorksiteModel.findOne({
        name: { $regex: `^${worksite}$`, $options: 'i' },
        region: regionDoc._id,
      }).session(session);

      if (!existingWorksite) {
        notExistWorksites.push(worksite);
      }
    }

    if (notExistWorksites.length > 0) {
      const worksiteDocs = notExistWorksites.map((worksite: string) => ({
        name: worksite,
        region: regionDoc._id,
      }));
      await WorksiteModel.insertMany(worksiteDocs, { session });
    }

    await session.commitTransaction();
    session.endSession();

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
    session.endSession();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};



