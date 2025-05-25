"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRegionById = exports.getRegionById = exports.updateRegionById = exports.getRegionsByCountry = exports.getAllRegions = exports.addRegion = void 0;
const RegionModel_1 = __importDefault(require("../models/RegionModel"));
const pagination_1 = require("../helper/pagination");
const CountryModel_1 = __importDefault(require("../models/CountryModel"));
const addRegion = async (req, res) => {
    try {
        const { name, countryId } = req.body;
        const isExist = await RegionModel_1.default.findOne({ name, country: countryId });
        if (isExist) {
            return res.status(400).json({
                success: false,
                message: req.i18n.t("regionValidationMessages.response.regionExist"),
            });
        }
        const isCountryExist = await CountryModel_1.default.findById(countryId);
        if (!isCountryExist) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("CountryValidationMessages.response.CountryNotExist"),
            });
        }
        const region = new RegionModel_1.default({ name, country: countryId });
        await region.save();
        return res.status(201).json({
            success: true,
            message: req.i18n.t("regionValidationMessages.response.addRegion.success"),
            data: region,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("regionValidationMessages.response.addRegion.server"),
        });
    }
};
exports.addRegion = addRegion;
const getAllRegions = async (req, res) => {
    try {
        const options = (0, pagination_1.getPaginationOptions)(req, {
            populate: [
                {
                    path: "country",
                    select: "name",
                },
            ],
            sort: { name: 1 },
        });
        const regions = await (0, pagination_1.paginate)(RegionModel_1.default, options);
        return res.status(200).json({
            success: true,
            message: req.i18n.t("regionValidationMessages.response.getAllRegions.success"),
            ...regions,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("regionValidationMessages.response.getAllRegions.server"),
        });
    }
};
exports.getAllRegions = getAllRegions;
const getRegionsByCountry = async (req, res) => {
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
        const regions = await RegionModel_1.default.find({ country: id })
            .populate("country", "name _id")
            .select("name country")
            .sort({ name: 1 });
        if (regions.length === 0) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("regionValidationMessages.response.getRegionsByCountry.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("regionValidationMessages.response.getRegionsByCountry.success"),
            // ...regions,
            data: regions
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("regionValidationMessages.response.getRegionsByCountry.server"),
        });
    }
};
exports.getRegionsByCountry = getRegionsByCountry;
const updateRegionById = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const isExist = await RegionModel_1.default.findOne({
            name,
            _id: { $ne: id },
        });
        if (isExist) {
            return res.status(400).json({
                success: false,
                message: req.i18n.t("regionValidationMessages.response.notFound"),
            });
        }
        const region = await RegionModel_1.default.findByIdAndUpdate(id, { name }, { new: true });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: req.i18n.t("regionValidationMessages.response.updateRegionById.server"),
            error,
        });
    }
};
exports.updateRegionById = updateRegionById;
const getRegionById = async (req, res) => {
    try {
        const { id } = req.params;
        const region = await RegionModel_1.default.findById(id);
        if (!region) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("regionValidationMessages.response.regionNotFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("regionValidationMessages.response.getRegionById.success"),
            data: region,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: req.i18n.t("regionValidationMessages.response.getRegionById.server"),
            error,
        });
    }
};
exports.getRegionById = getRegionById;
const deleteRegionById = async (req, res) => {
    try {
        const { id } = req.params;
        const region = await RegionModel_1.default.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!region) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("regionValidationMessages.response.regionNotFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("regionValidationMessages.response.deleteRegionById.success"),
            data: region,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("regionValidationMessages.response.deleteRegionById.server"),
        });
    }
};
exports.deleteRegionById = deleteRegionById;
