import { Request, Response } from "express";
import LocationModel, { ILocation } from "../models/LocationModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import mongoose from "mongoose";
import CountryModel from "../models/CountryModel";
import RegionModel from "../models/RegionModel";
import WorksiteModel from "../models/WorksiteModel";

// Create a new location
export const createLocation = async (req: Request, res: Response) => {
  try {
    const { country, region, worksite }: ILocation = req.body;
    const isExist = await LocationModel.findOne({ country, region, worksite });
    if (isExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t(
          "locationValidationMessages.response.createLocation.locationExist"
        ),
      });
    }
    const location = new LocationModel({ country, region, worksite });
    await location.save();
    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "locationValidationMessages.response.createLocation.success"
      ),
      location,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "locationValidationMessages.response.createLocation.server"
      ),
    });
  }
};

// Get all locations
export const getLocations = async (req: Request, res: Response) => {
  try {
    // const locations = await LocationModel.find({ isVisible: true });
    const options = getPaginationOptions(req, {
      sort: { createdAt: -1 },
      filter: { isDeleted: false },
    });
    const result = await paginate(LocationModel, options);
    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "locationValidationMessages.response.getLocations.success"
      ),
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "locationValidationMessages.response.getLocations.server"
      ),
    });
  }
};

// Get a location by ID
export const getLocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await LocationModel.findById(id);
    if (!location) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "locationValidationMessages.response.getLocationById.notFound"
        ),
      });
    }
    return res.status(200).json({ 
      success: true, 
      data: location,
      message: req.i18n.t(
        "locationValidationMessages.response.getLocationById.success"
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "locationValidationMessages.response.getLocationById.server"
      ),
    });
  }
};

// Update a location by ID
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { country, region, worksite } = req.body;
    const isExist = await LocationModel.findOne({
      country: { $regex: new RegExp(`^${country.trim()}$`, "i") },
      region: { $regex: new RegExp(`^${region.trim()}$`, "i") },
      worksite: { $regex: new RegExp(`^${worksite.trim()}$`, "i") },
    });

    if (isExist && isExist._id.toString() !== id.toString()) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t(
          "locationValidationMessages.response.updateLocation.locationExist"
        ),
      });
    }

    const location = await LocationModel.findByIdAndUpdate(
      id,
      { country, region, worksite },
      { new: true, runValidators: true }
    );
    if (!location) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "locationValidationMessages.response.updateLocation.notFound"
        ),
      });
    }
    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "locationValidationMessages.response.updateLocation.success"
      ),
      data: location,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: req.i18n.t(
        "locationValidationMessages.response.updateLocation.server"
      ),
      error,
    });
  }
};

// Soft delete a location by ID
export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await LocationModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: false }
    );

    if (!location) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "locationValidationMessages.response.deleteLocationById.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "locationValidationMessages.response.deleteLocationById.success"
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "locationValidationMessages.response.deleteLocationById.server"
      ),
    });
  }
};

// Hard delete a location by ID
export const hardDeleteLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await LocationModel.findByIdAndDelete(id);

    if (!location) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t(
          "locationValidationMessages.response.hardDeleteLocation.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "locationValidationMessages.response.hardDeleteLocation.success"
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "locationValidationMessages.response.hardDeleteLocation.server"
      ),
    });
  }
};

// Fetch distinct countries
export const getDistinctCountries = async (req: Request, res: Response) => {
  try {
    const countries = await LocationModel.distinct('country', { isDeleted: false });
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

// Fetch distinct regions for a given country
export const getRegionsByCountry = async (req: Request, res: Response) => {
  try {
    const { country } = req.query;
    const regions = await LocationModel.distinct('region', { country, isDeleted: false });

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


// Fetch distinct worksites for a given country and region
export const getWorksitesByRegionAndCountry = async (req: Request, res: Response) => {
  try {
    const { country, region } = req.query;
    const worksites = await LocationModel.find(
      { country, region, isDeleted: false },
      { __v: 0 } // Exclude version key from the response
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




  const obj = {
    contry:"India",
    region:"Karnataka",
    worksites:["Bangalore","Mysore"]
  }
