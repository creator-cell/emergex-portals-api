"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCountryRegionWorksites = exports.deleteWorksiteById = exports.getWorksiteById = exports.updateWorksiteById = exports.getWorksitesByRegion = exports.getAllWorksites = exports.addWorksite = void 0;
const WorksiteModel_1 = __importDefault(require("../models/WorksiteModel"));
const RegionModel_1 = __importDefault(require("../models/RegionModel"));
const pagination_1 = require("../helper/pagination");
const CountryModel_1 = __importDefault(require("../models/CountryModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const addWorksite = async (req, res) => {
    try {
        const { name, regionId } = req.body;
        const isExist = await WorksiteModel_1.default.findOne({ name, region: regionId });
        if (isExist) {
            return res.status(400).json({
                success: false,
                message: req.i18n.t("worksiteValidationMessages.response.workSiteExist"),
            });
        }
        const isRegionExist = await RegionModel_1.default.findById(regionId);
        if (!isRegionExist) {
            return res.status(400).json({
                success: false,
                message: req.i18n.t("regionValidationMessages.response.regionNotExist"),
            });
        }
        const worksite = new WorksiteModel_1.default({ name, region: regionId });
        await worksite.save();
        return res.status(201).json({
            success: true,
            message: req.i18n.t("worksiteValidationMessages.response.addWorksite.success"),
            data: worksite,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("worksiteValidationMessages.response.addWorksite.server"),
        });
    }
};
exports.addWorksite = addWorksite;
const getAllWorksites = async (req, res) => {
    try {
        const options = (0, pagination_1.getPaginationOptions)(req, {
            populate: [
                {
                    path: "region",
                    populate: [{
                            path: "country",
                        }]
                },
            ],
        });
        const worksites = await (0, pagination_1.paginate)(WorksiteModel_1.default, options);
        return res.status(200).json({
            success: true,
            message: req.i18n.t("worksiteValidationMessages.response.getAllWorksites.success"),
            ...worksites,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("worksiteValidationMessages.response.getAllWorksites.server"),
        });
    }
};
exports.getAllWorksites = getAllWorksites;
const getWorksitesByRegion = async (req, res) => {
    const { id } = req.params;
    try {
        const options = (0, pagination_1.getPaginationOptions)(req, {
            populate: [
                {
                    path: "region",
                    populate: [{
                            path: "country",
                        }]
                },
            ],
            filter: { region: id, isDeleted: false },
        });
        const worksites = await (0, pagination_1.paginate)(WorksiteModel_1.default, options);
        if (!worksites.data.length) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("worksiteValidationMessages.response.getWorksitesByRegion.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("worksiteValidationMessages.response.getWorksitesByRegion.success"),
            ...worksites
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("worksiteValidationMessages.response.getWorksitesByRegion.server") + id
        });
    }
};
exports.getWorksitesByRegion = getWorksitesByRegion;
const updateWorksiteById = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, regionId } = req.body;
        const worksite = await WorksiteModel_1.default.findById(id);
        if (!worksite) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("worksiteValidationMessages.response.notFound"),
            });
        }
        if (name && regionId) {
            const isExist = await WorksiteModel_1.default.findOne({
                name,
                region: regionId,
                _id: { $ne: id },
            });
            if (isExist) {
                return res.status(400).json({
                    success: false,
                    message: req.i18n.t("worksiteValidationMessages.response.workSiteExistInRegion"),
                });
            }
        }
        if (regionId) {
            const isRegionExist = await RegionModel_1.default.findById(regionId);
            if (!isRegionExist) {
                return res.status(400).json({
                    success: false,
                    message: req.i18n.t("regionValidationMessages.response.regionNotExist"),
                });
            }
        }
        const updatedFields = {};
        if (name)
            updatedFields.name = name;
        if (regionId)
            updatedFields.region = regionId;
        const updatedWorksite = await WorksiteModel_1.default.findByIdAndUpdate(id, updatedFields, { new: true });
        return res.status(200).json({
            success: true,
            message: req.i18n.t("worksiteValidationMessages.response.updateWorksiteById.success"),
            data: updatedWorksite,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("worksiteValidationMessages.response.updateWorksiteById.server"),
        });
    }
};
exports.updateWorksiteById = updateWorksiteById;
const getWorksiteById = async (req, res) => {
    try {
        const { id } = req.params;
        const worksite = await WorksiteModel_1.default.findById(id).populate({
            path: "region",
            populate: {
                path: "country"
            }
        });
        if (!worksite) {
            return res.status(200).json({
                success: false,
                message: "Worksite not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Worksite deleted successfully",
            data: worksite,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting worksite",
            error,
        });
    }
};
exports.getWorksiteById = getWorksiteById;
const deleteWorksiteById = async (req, res) => {
    try {
        const { id } = req.params;
        const worksite = await WorksiteModel_1.default.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting worksite",
            error: req.i18n.t("worksiteValidationMessages.response.deleteWorksiteById.success"),
        });
    }
};
exports.deleteWorksiteById = deleteWorksiteById;
const addCountryRegionWorksites = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { country, region, worksites } = req.body;
        let isCountryExist = false;
        let isRegionExist = false;
        let countryDoc;
        let regionDoc;
        const existingCountry = await CountryModel_1.default.findOne({
            name: { $regex: `^${country}$`, $options: 'i' },
        }).session(session);
        if (existingCountry) {
            isCountryExist = true;
            countryDoc = existingCountry;
        }
        else {
            const createdCountry = await CountryModel_1.default.create([{ name: country }], { session });
            countryDoc = createdCountry[0];
        }
        const existingRegion = await RegionModel_1.default.findOne({
            name: { $regex: `^${region}$`, $options: 'i' },
            country: countryDoc._id,
        }).session(session);
        if (existingRegion) {
            isRegionExist = true;
            regionDoc = existingRegion;
        }
        else {
            const createdRegion = await RegionModel_1.default.create([{ name: region, country: countryDoc._id }], { session });
            regionDoc = createdRegion[0];
        }
        const notExistWorksites = [];
        for (const worksite of worksites) {
            const existingWorksite = await WorksiteModel_1.default.findOne({
                name: { $regex: `^${worksite}$`, $options: 'i' },
                region: regionDoc._id,
            }).session(session);
            if (!existingWorksite) {
                notExistWorksites.push(worksite);
            }
        }
        if (notExistWorksites.length > 0) {
            const worksiteDocs = notExistWorksites.map((worksite) => ({
                name: worksite,
                region: regionDoc._id,
            }));
            await WorksiteModel_1.default.insertMany(worksiteDocs, { session });
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
    }
    catch (error) {
        await session.abortTransaction();
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
    finally {
        session.endSession();
    }
};
exports.addCountryRegionWorksites = addCountryRegionWorksites;
