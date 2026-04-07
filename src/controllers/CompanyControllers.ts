import { Response } from "express";
import CompanyModel from "../models/CompanyModel";
import { logger } from "../config/logger";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const getCompany = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: "Company not found for this user",
      });
    }

    const company = await CompanyModel.findById(user.companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    logger.error("Get company error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const getCompanyById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const company = await CompanyModel.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    logger.error("Get company by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const updateCompany = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: "Company not found for this user",
      });
    }

    const {
      name,
      logo,
      location,
      businessType,
      emergencyContactNumber,
      email,
      contactNumber,
    } = req.body;

    const company = await CompanyModel.findByIdAndUpdate(
      user.companyId,
      {
        name: name || undefined,
        logo: logo || undefined,
        location: location || undefined,
        businessType: businessType || undefined,
        emergencyContactNumber: emergencyContactNumber || undefined,
        email: email || undefined,
        contactNumber: contactNumber || undefined,
      },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
      });
    }

    logger.info(`Company updated: ${company.name}`);

    res.json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    logger.error("Update company error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
