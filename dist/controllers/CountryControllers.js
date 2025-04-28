"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCountryRegionsWorksites = exports.getCountryById = exports.deleteCountryById = exports.updateCountryById = exports.getAllCountries = exports.addCountry = void 0;
const CountryModel_1 = __importDefault(require("../models/CountryModel"));
const pagination_1 = require("../helper/pagination");
const RegionModel_1 = __importDefault(require("../models/RegionModel"));
const WorksiteModel_1 = __importDefault(require("../models/WorksiteModel"));
const addCountry = async (req, res) => {
    try {
        const { name } = req.body;
        const isExist = await CountryModel_1.default.findOne({ name });
        if (isExist) {
            return res.status(400).json({
                success: false,
                message: req.i18n.t("countryValidationMessages.response.CountryExist"),
            });
        }
        const country = new CountryModel_1.default({ name });
        await country.save();
        return res.status(201).json({
            success: true,
            message: req.i18n.t("countryValidationMessages.response.addCountry.success"),
            data: country,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("countryValidationMessages.response.addCountry.server"),
        });
    }
};
exports.addCountry = addCountry;
const getAllCountries = async (req, res) => {
    try {
        const options = (0, pagination_1.getPaginationOptions)(req, {
            sort: { name: 1 },
        });
        const countries = await (0, pagination_1.paginate)(CountryModel_1.default, options);
        return res.status(200).json({
            success: true,
            message: req.i18n.t("countryValidationMessages.response.getAllCountries.success"),
            ...countries,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("countryValidationMessages.response.getAllCountries.server"),
        });
    }
};
exports.getAllCountries = getAllCountries;
const updateCountryById = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const isExist = await CountryModel_1.default.findOne({
            name,
            _id: { $ne: id },
        });
        if (isExist) {
            return res.status(400).json({
                success: false,
                message: req.i18n.t("countryValidationMessages.response.CountryExist"),
            });
        }
        const country = await CountryModel_1.default.findByIdAndUpdate(id, { name }, { new: true });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("countryValidationMessages.response.updateCountryById.server"),
        });
    }
};
exports.updateCountryById = updateCountryById;
const deleteCountryById = async (req, res) => {
    try {
        const { id } = req.params;
        const country = await CountryModel_1.default.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("countryValidationMessages.response.deleteCountryById.server"),
        });
    }
};
exports.deleteCountryById = deleteCountryById;
const getCountryById = async (req, res) => {
    try {
        const { id } = req.params;
        const country = await CountryModel_1.default.findById(id);
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("countryValidationMessages.response.getCountryById.server"),
        });
    }
};
exports.getCountryById = getCountryById;
const getCountryRegionsWorksites = async (req, res) => {
    try {
        const countries = await CountryModel_1.default.find().lean(); // Fetch all countries
        const result = [];
        for (const country of countries) {
            const regions = await RegionModel_1.default.find({ country: country._id }).lean();
            const regionDetails = [];
            for (const region of regions) {
                const worksites = await WorksiteModel_1.default.find({ region: region._id })
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch data',
            error: error.message,
        });
    }
};
exports.getCountryRegionsWorksites = getCountryRegionsWorksites;
