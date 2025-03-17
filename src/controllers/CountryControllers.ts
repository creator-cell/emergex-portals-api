import { Request, Response } from "express";
import CountryModel from "../models/CountryModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import RegionModel from "../models/RegionModel";
import WorksiteModel from "../models/WorksiteModel";

export const addCountry = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const isExist = await CountryModel.findOne({ name });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t("countryValidationMessages.response.CountryExist"),
      });
    }

    const country = new CountryModel({ name });
    await country.save();

    return res.status(201).json({
      success: true,
      message: req.i18n.t("countryValidationMessages.response.addCountry.success"),
      data: country,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t("countryValidationMessages.response.addCountry.server"),
    });
  }
};

export const getAllCountries = async (req: Request, res: Response) => {
  try {
    const options = getPaginationOptions(req,{
        sort: { name: 1 },
    });
    const countries = await paginate(CountryModel, options);
    return res.status(200).json({
      success: true,
      message:  req.i18n.t("countryValidationMessages.response.getAllCountries.success"),
      ...countries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("countryValidationMessages.response.getAllCountries.server"),
    });
  }
};

export const updateCountryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const isExist = await CountryModel.findOne({
      name,
      _id: { $ne: id },
    });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t("countryValidationMessages.response.CountryExist"),
      });
    }

    const country = await CountryModel.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!country) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("countryValidationMessages.response.CountryNotFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t("countryValidationMessages.response.updateCountryById.success"),
      data: country,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("countryValidationMessages.response.updateCountryById.server"),
    });
  }
};

export const deleteCountryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const country = await CountryModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!country) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("countryValidationMessages.response.CountryNotFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t("countryValidationMessages.response.deleteCountryById.success"),
      data: country,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("countryValidationMessages.response.deleteCountryById.server"),
    });
  }
};

export const getCountryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const country = await CountryModel.findById(id);

    if (!country) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("countryValidationMessages.response.CountryNotFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t("countryValidationMessages.response.getCountryById.success"),
      data: country,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("countryValidationMessages.response.getCountryById.server"),
    });
  }
};

export const getCountryRegionsWorksites = async (req: Request, res: Response) => {
  try {
    const countries = await CountryModel.find().lean(); // Fetch all countries
    const result = [];

    for (const country of countries) {
      const regions = await RegionModel.find({ country: country._id }).lean();
      const regionDetails = [];

      for (const region of regions) {
        const worksites = await WorksiteModel.find({ region: region._id })
          .select('_id name')
          .lean(); 
        regionDetails.push({
          _id: region._id,
          name: region.name,
          worksites,
        });
      }

      result.push({
        _id: country._id,
        name: country.name,
        regions: regionDetails,
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch data',
      error: error.message,
    });
  }
};

