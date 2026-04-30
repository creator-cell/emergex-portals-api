import { Request, Response } from "express";
import LocationModel, { ILocation } from "../models/LocationModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import CountryModel from "../models/CountryModel";
import RegionModel from "../models/RegionModel";
import WorksiteModel from "../models/WorksiteModel";
import { ICustomRequest } from "../types/express";
import UserModel from "../models/UserModel";

export const createLocation = async (req: Request, res: Response) => {
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

    const { country, region, worksite }: ILocation = req.body;

    const isCountryExist = await CountryModel.findOne({ _id: country, companyId });
    const isRegionExist = await RegionModel.findOne({ _id: region, companyId });
    const isWorksiteExist = await WorksiteModel.findOne({ _id: worksite, companyId });

    if (!isCountryExist || !isRegionExist || !isWorksiteExist) {
      return res.status(400).json({
        success: false,
        message: "Invalid country, region, or worksite for your company",
      });
    }

    const isExist = await LocationModel.findOne({ country, region, worksite, companyId });
    if (isExist) {
      return res.status(400).json({
        success: false,
        message: "Location already exists",
      });
    }
    const location = new LocationModel({ country, region, worksite, companyId });
    await location.save();
    return res.status(201).json({
      success: true,
      message: "Location created successfully",
      location,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getLocations = async (req: Request, res: Response) => {
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
      sort: { createdAt: -1 },
      filter: { companyId, isDeleted: false },
    });
    const result = await paginate(LocationModel, options);
    return res.status(200).json({
      success: true,
      message: "Locations fetched successfully",
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getLocationById = async (req: Request, res: Response) => {
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
    const location = await LocationModel.findOne({ _id: id, companyId });
    if (!location) {
      return res.status(200).json({
        success: false,
        message: "Location not found",
      });
    }
    return res.status(200).json({ 
      success: true, 
      data: location,
      message: "Location fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
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
    const { country, region, worksite } = req.body;

    if (country) {
      const isCountryExist = await CountryModel.findOne({ _id: country, companyId });
      if (!isCountryExist) {
        return res.status(400).json({
          success: false,
          message: "Invalid country for your company",
        });
      }
    }

    if (region) {
      const isRegionExist = await RegionModel.findOne({ _id: region, companyId });
      if (!isRegionExist) {
        return res.status(400).json({
          success: false,
          message: "Invalid region for your company",
        });
      }
    }

    if (worksite) {
      const isWorksiteExist = await WorksiteModel.findOne({ _id: worksite, companyId });
      if (!isWorksiteExist) {
        return res.status(400).json({
          success: false,
          message: "Invalid worksite for your company",
        });
      }
    }

    const location = await LocationModel.findOneAndUpdate(
      { _id: id, companyId },
      { country, region, worksite },
      { new: true, runValidators: true }
    );
    if (!location) {
      return res.status(200).json({
        success: false,
        message: "Location not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: location,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
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
    const location = await LocationModel.findOneAndUpdate(
      { _id: id, companyId },
      { isDeleted: true },
      { new: false }
    );

    if (!location) {
      return res.status(200).json({
        success: false,
        message: "Location not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const hardDeleteLocation = async (req: Request, res: Response) => {
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
    const location = await LocationModel.findOneAndDelete({ _id: id, companyId });

    if (!location) {
      return res.status(200).json({
        success: false,
        message: "Location not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getDistinctCountries = async (req: Request, res: Response) => {
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

    const countries = await LocationModel.distinct('country', { companyId, isDeleted: false });
    res.status(200).json({
      success: true,
      message: 'Countries fetched successfully',
      data: countries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching countries',
      error,
    });
  }
};

export const getRegionsByCountry = async (req: Request, res: Response) => {
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

    const { country } = req.query;
    const regions = await LocationModel.distinct('region', { country, companyId, isDeleted: false });

    if (regions.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No regions found for the given country',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Regions fetched successfully',
      data: regions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching regions',
      error,
    });
  }
};

export const getWorksitesByRegionAndCountry = async (req: Request, res: Response) => {
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

    const { country, region } = req.query;
    const worksites = await LocationModel.find(
      { country, region, companyId, isDeleted: false },
      { __v: 0 }
    );

    if (worksites.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No worksites found for the given country and region',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Worksites fetched successfully',
      data: worksites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching worksites',
      error,
    });
  }
};
