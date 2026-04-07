import { Request, Response } from "express";
import CountryModel from "../models/CountryModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import RegionModel from "../models/RegionModel";
import WorksiteModel from "../models/WorksiteModel";
import mongoose from "mongoose";
import { ICustomRequest } from "../types/express";
import UserModel from "../models/UserModel";

export const addCountry = async (req: Request, res: Response) => {
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

    const { name } = req.body;
    const isExist = await CountryModel.findOne({ name, companyId });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t("countryValidationMessages.response.CountryExist"),
      });
    }

    const country = new CountryModel({ name, companyId });
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

    const countries = await CountryModel.find({ companyId })
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message:  req.i18n.t("countryValidationMessages.response.getAllCountries.success"),
      data:countries
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("countryValidationMessages.response.getAllCountries.server"),
    });
  }
};

export const updateCountryById = async (req: Request, res: Response) => {
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
    const { name } = req.body;

    const isExist = await CountryModel.findOne({
      name,
      companyId,
      _id: { $ne: id },
    });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t("countryValidationMessages.response.CountryExist"),
      });
    }

    const country = await CountryModel.findOneAndUpdate(
      { _id: id, companyId },
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

    const country = await CountryModel.findOneAndUpdate(
      { _id: id, companyId },
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

    const country = await CountryModel.findOne({ _id: id, companyId });

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

    const countries = await CountryModel.find({ companyId }).lean();
    const result = [];

    for (const country of countries) {
      const regions = await RegionModel.find({ country: country._id, companyId }).lean();
      const regionDetails = [];

      for (const region of regions) {
        const worksites = await WorksiteModel.find({ region: region._id, companyId })
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

