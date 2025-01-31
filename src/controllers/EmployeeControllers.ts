import { Request, Response } from "express";
import EmployeeModel, { IEmployee } from "../models/EmployeeModel";
import { getPaginationOptions, paginate } from "../helper/pagination";

// Create a new employee
export const createEmployee = async (req: Request, res: Response) => {
  const { name, email, designation, contactNo } = req.body;
  try {
    const checkExist = await EmployeeModel.findOne({ email });

    if (checkExist) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.createEmployee.exist"
        ),
      });
    }

    const employee = new EmployeeModel({
      name,
      email,
      designation,
      contactNo,
    });
    const savedEmployee = await employee.save();

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "employeeValidationMessages.response.createEmployee.success"
      ),
      data: savedEmployee,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.createEmployee.server"
      ),
    });
  }
};

// Get all employees
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const options = getPaginationOptions(req, {
      sort: { createdAt: -1 },
    });
    const result = await paginate(EmployeeModel, options);

    return res.status(200).json({
      success: true,
      ...result,
      message: req.i18n.t(
        "employeeValidationMessages.response.getAllEmployees.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.getAllEmployees.server"
      ),
    });
  }
};

// Get a single employee by ID
export const getEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const employee = await EmployeeModel.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.getEmployeeById.notFound"
        ),
      });
    }
    return res.status(200).json({
      success: true,
      data: employee,
      message: req.i18n.t(
        "employeeValidationMessages.response.getEmployeeById.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.getEmployeeById.server"
      ),
    });
  }
};

// Update a employee
export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, designation, contactNo } = req.body;
  try {
    if (email) {
      const isExist = (await EmployeeModel.findOne({
        email,
      })) as IEmployee | null;

      if (isExist && isExist._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          error: req.i18n.t(
            "employeeValidationMessages.response.updateEmployeeById.exist"
          ),
        });
      }
    }

    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      id,
      { name, email, designation, contactNo },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.updateEmployeeById.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "employeeValidationMessages.response.updateEmployeeById.success"
      ),
      data: updatedEmployee,
    });
  } catch (error: any) {
    console.log("error in updating employee: ", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.updateEmployeeById.server"
      ),
    });
  }
};

// Delete a employee
export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedEmployee = await EmployeeModel.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return res.status(404).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.deleteEmployeeById.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "employeeValidationMessages.response.deleteEmployeeById.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.deleteEmployeeById.server"
      ),
    });
  }
};
