import { Request, Response } from "express";
import RegionModel from "../models/RegionModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import CountryModel from "../models/CountryModel";

export const addRegion = async (req: Request, res: Response) => {
  try {
    const { name, countryId } = req.body;

    const isExist = await RegionModel.findOne({ name, country: countryId });
    if (isExist) {
      return res.status(400).json({
        success: false,
        message:req.i18n.t("regionValidationMessages.response.regionExist"),
      });
    }

    const isCountryExist = await CountryModel.findById(countryId);
    if (!isCountryExist) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("CountryValidationMessages.response.CountryNotExist"),
      });
    } 

    const region = new RegionModel({ name, country: countryId });
    await region.save();

    return res.status(201).json({
      success: true,
      message:req.i18n.t("regionValidationMessages.response.addRegion.success"),
      data: region,
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("regionValidationMessages.response.addRegion.server"),
    });
  }
};

export const getAllRegions = async (req: Request, res: Response) => {
  try {
    const options = getPaginationOptions(req, {
      populate: [
        {
          path: "country",
          select: "name",
        },
      ],
      sort: { name: 1 },
    });
    const regions = await paginate(RegionModel, options);

    return res.status(200).json({
      success: true,
      message: req.i18n.t("regionValidationMessages.response.getAllRegions.success"),
      ...regions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("regionValidationMessages.response.getAllRegions.server"),
    });
  }
};

export const getRegionsByCountry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // const options = getPaginationOptions(req, {
    //   populate: [
    //     {
    //       path: "country",
    //       "select": "name _id",
    //     },
    //   ],
    //   sort: { name: 1 },
    //   filter: { country: id },
    // });
    // const regions = await paginate(RegionModel, options);

    const regions = await RegionModel.find({ country: id })
      .populate("country", "name _id")
      .select("name country")
      .sort({ name: 1 });


    if(regions.length === 0){
      return res.status(200).json({
        success: false,
        message:req.i18n.t("regionValidationMessages.response.getRegionsByCountry.notFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t("regionValidationMessages.response.getRegionsByCountry.success"),
      // ...regions,
      data:regions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("regionValidationMessages.response.getRegionsByCountry.server"),
    });
  }
};

export const updateRegionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const isExist = await RegionModel.findOne({
      name,
      _id: { $ne: id },
    });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: req.i18n.t("regionValidationMessages.response.notFound"),
      });
    }

    const region = await RegionModel.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!region) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("regionValidationMessages.response.regionNotFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t("regionValidationMessages.response.updateRegionById.success")
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: req.i18n.t("regionValidationMessages.response.updateRegionById.server"),
      error,
    });
  }
};

export const getRegionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const region = await RegionModel.findById(id);

    if (!region) {
      return res.status(200).json({
        success: false,
        message: req.i18n.t("regionValidationMessages.response.regionNotFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message:  req.i18n.t("regionValidationMessages.response.getRegionById.success"),
      data: region,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:  req.i18n.t("regionValidationMessages.response.getRegionById.server"),
      error,
    });
  }
};

export const deleteRegionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const region = await RegionModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!region) {
      return res.status(200).json({
        success: false,
        message:  req.i18n.t("regionValidationMessages.response.regionNotFound"),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t("regionValidationMessages.response.deleteRegionById.success"),
      data: region,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:req.i18n.t("regionValidationMessages.response.deleteRegionById.server"),
    });
  }
};
