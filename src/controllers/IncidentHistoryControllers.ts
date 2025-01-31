import { Request, Response } from "express";
import IncidentHistoryModel from "../models/IncidentHistory";
import moment from "moment";
import { getPaginationOptions, paginate } from "../helper/pagination";
import EmployeeModel from "../models/EmployeeModel";
import IncidentModel from "../models/IncidentModel";

// Controller to add an IncidentHistory
export const addIncidentHistory = async (req: Request, res: Response) => {
  try {
    const { incident, employee, title, role } = req.body;

    const formattedDate = moment().format("DD-MMM-YYYY");
    const formattedTime = moment().format("hh:mm A");

    const isEmployeeExist = await EmployeeModel.findById(employee);
    if (!isEmployeeExist) {
      return res.status(404).json({
        success: false,
        error: `${req.i18n.t(
          "employeeValidationMessages.response.notExist"
        )} ${employee}`,
      });
    }

    const isIncidentExist = await IncidentModel.findById(incident);
    if (!isIncidentExist) {
      return res.status(404).json({
        success: false,
        error: `${req.i18n.t(
          "incidentValidationMessages.response.notExist"
        )} ${incident}`,
      });
    }

    // Create new IncidentHistory document
    const newIncidentHistory = new IncidentHistoryModel({
      incident,
      employee,
      title,
      //   role,
      date: formattedDate,
      time: formattedTime,
    });

    await newIncidentHistory.save();

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "incidentHistoryValidationMessages.response.addIncidentHistory.success"
      ),
      newIncidentHistory,
    });
  } catch (error) {
    console.error("Error adding incident history:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: req.i18n.t(
          "incidentHistoryValidationMessages.response.addIncidentHistory.server"
        ),
      });
  }
};

// Get hsitory-by-incident-id
export const getIncidentHistoryByIncidentId = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const options = getPaginationOptions(req, {
      populate: [
        {
          path: "incident",
          model: "Incident",
        },
        {
          path: "employee",
          model: "Employee",
          select: "name designation",
        },
      ],
      filter: { incident: id },
      sort: { date: -1 },
    });

    const history = await paginate(IncidentHistoryModel, options);

    if (!history.data.length) {
      return res.status(404).json({
        success: false,
        message: `${req.i18n.t(
          "incidentHistoryValidationMessages.response.getIncidentHistoryByIncidentId.notFound"
        )} ${id}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "incidentHistoryValidationMessages.response.getIncidentHistoryByIncidentId.success"
      ),
      ...history,
    });
  } catch (error) {
    console.error("Error adding incident history:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: req.i18n.t(
          "incidentHistoryValidationMessages.response.getIncidentHistoryByIncidentId.server"
        ),
      });
  }
};
