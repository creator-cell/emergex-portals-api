"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorksitesByRegionAndCountry = exports.getRegionsByCountry = exports.getDistinctCountries = exports.hardDeleteLocation = exports.deleteLocation = exports.updateLocation = exports.getLocationById = exports.getLocations = exports.createLocation = void 0;
const LocationModel_1 = __importDefault(require("../models/LocationModel"));
const pagination_1 = require("../helper/pagination");
// Create a new location
const createLocation = async (req, res) => {
    try {
        const { country, region, worksite } = req.body;
        const isExist = await LocationModel_1.default.findOne({ country, region, worksite });
        if (isExist) {
            return res.status(400).json({
                success: false,
                message: req.i18n.t("locationValidationMessages.response.createLocation.locationExist"),
            });
        }
        const location = new LocationModel_1.default({ country, region, worksite });
        await location.save();
        return res.status(201).json({
            success: true,
            message: req.i18n.t("locationValidationMessages.response.createLocation.success"),
            location,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("locationValidationMessages.response.createLocation.server"),
        });
    }
};
exports.createLocation = createLocation;
// Get all locations
const getLocations = async (req, res) => {
    try {
        // const locations = await LocationModel.find({ isVisible: true });
        const options = (0, pagination_1.getPaginationOptions)(req, {
            sort: { createdAt: -1 },
            filter: { isDeleted: false },
        });
        const result = await (0, pagination_1.paginate)(LocationModel_1.default, options);
        return res.status(200).json({
            success: true,
            message: req.i18n.t("locationValidationMessages.response.getLocations.success"),
            ...result,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("locationValidationMessages.response.getLocations.server"),
        });
    }
};
exports.getLocations = getLocations;
// Get a location by ID
const getLocationById = async (req, res) => {
    try {
        const { id } = req.params;
        const location = await LocationModel_1.default.findById(id);
        if (!location) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("locationValidationMessages.response.getLocationById.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            data: location,
            message: req.i18n.t("locationValidationMessages.response.getLocationById.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("locationValidationMessages.response.getLocationById.server"),
        });
    }
};
exports.getLocationById = getLocationById;
// Update a location by ID
const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { country, region, worksite } = req.body;
        const isExist = await LocationModel_1.default.findOne({
            country: { $regex: new RegExp(`^${country.trim()}$`, "i") },
            region: { $regex: new RegExp(`^${region.trim()}$`, "i") },
            worksite: { $regex: new RegExp(`^${worksite.trim()}$`, "i") },
        });
        if (isExist && isExist._id.toString() !== id.toString()) {
            return res.status(400).json({
                success: false,
                message: req.i18n.t("locationValidationMessages.response.updateLocation.locationExist"),
            });
        }
        const location = await LocationModel_1.default.findByIdAndUpdate(id, { country, region, worksite }, { new: true, runValidators: true });
        if (!location) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("locationValidationMessages.response.updateLocation.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("locationValidationMessages.response.updateLocation.success"),
            data: location,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: req.i18n.t("locationValidationMessages.response.updateLocation.server"),
            error,
        });
    }
};
exports.updateLocation = updateLocation;
// Soft delete a location by ID
const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const location = await LocationModel_1.default.findByIdAndUpdate(id, { isDeleted: true }, { new: false });
        if (!location) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("locationValidationMessages.response.deleteLocationById.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("locationValidationMessages.response.deleteLocationById.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("locationValidationMessages.response.deleteLocationById.server"),
        });
    }
};
exports.deleteLocation = deleteLocation;
// Hard delete a location by ID
const hardDeleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const location = await LocationModel_1.default.findByIdAndDelete(id);
        if (!location) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("locationValidationMessages.response.hardDeleteLocation.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("locationValidationMessages.response.hardDeleteLocation.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("locationValidationMessages.response.hardDeleteLocation.server"),
        });
    }
};
exports.hardDeleteLocation = hardDeleteLocation;
// Fetch distinct countries
const getDistinctCountries = async (req, res) => {
    try {
        const countries = await LocationModel_1.default.distinct('country', { isDeleted: false });
        res.status(200).json({
            success: true,
            message: 'Countries fetched successfully',
            data: countries,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching countries',
            error,
        });
    }
};
exports.getDistinctCountries = getDistinctCountries;
// Fetch distinct regions for a given country
const getRegionsByCountry = async (req, res) => {
    try {
        const { country } = req.query;
        const regions = await LocationModel_1.default.distinct('region', { country, isDeleted: false });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching regions',
            error,
        });
    }
};
exports.getRegionsByCountry = getRegionsByCountry;
// Fetch distinct worksites for a given country and region
const getWorksitesByRegionAndCountry = async (req, res) => {
    try {
        const { country, region } = req.query;
        const worksites = await LocationModel_1.default.find({ country, region, isDeleted: false }, { __v: 0 } // Exclude version key from the response
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching worksites',
            error,
        });
    }
};
exports.getWorksitesByRegionAndCountry = getWorksitesByRegionAndCountry;
const obj = {
    contry: "India",
    region: "Karnataka",
    worksites: ["Bangalore", "Mysore"]
};
