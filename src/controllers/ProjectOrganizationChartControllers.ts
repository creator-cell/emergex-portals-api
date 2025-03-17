import { Request, Response } from "express";
import ProjectOrganizationChartModel from "../models/ProjectOrganizationChartModel";
import EmployeeModel from "../models/EmployeeModel";

export const addProjectOrganizationChart = async (req: Request, res: Response) => {
  try {
    const { project, from, to, team, employee } = req.body;
    const existingCharts = await ProjectOrganizationChartModel.find({ project });

    if(!project){
        return res.status(200).json({
            success:false,
            error:"Project not exist with id: "
        })
    }

    let priority;

    if(!from && !to){
        priority=1;
    }

    if(from && !to){

        const isFromEmployeeExist = await EmployeeModel.findById(from);
        if(!isFromEmployeeExist){
            return res.status(200).json({
                success:"Employee not exist with id: "
            })
        }

        const isFromExistInCurrentProjectChart = existingCharts.some((chart)=>chart.employee===from)
        if(!isFromExistInCurrentProjectChart){
            return res.status(200).json({
                success:"From Employee not exist in project chart"
            })
        }

        existingCharts.forEach((chart)=>{
           if( chart.employee===from) {
            priority=chart.priority as number+1;
           }
        })
    }

    if(from && to){
        let fromPriority;
        let toPriority;
        existingCharts.forEach((chart)=>{
           if( chart.employee===from) {
            fromPriority=chart.priority as number+1;
           }
        })
        existingCharts.forEach((chart)=>{
           if( chart.employee===to) {
            toPriority=chart.priority as number-1;
           }
        })
        if(fromPriority!==toPriority){
            throw new Error("Error in settling priority in project organization chart")
        }
        priority=fromPriority;
    }

    if (existingCharts.length > 0) {
      if (from && !to) {
        const maxPriority = Math.max(...existingCharts.map(chart => chart.priority || 0));
        priority = maxPriority + 1;
      } else if (from && to) {
        const fromPriority = Math.max(...existingCharts.map(chart => chart.priority || 0)) + 1;
        const toPriority = fromPriority - 2;

        await ProjectOrganizationChartModel.updateMany(
          { project, employee: to },
          { $inc: { priority: -1 } }
        );

        priority = fromPriority;
      }
    }

    const newChart = new ProjectOrganizationChartModel({
      project,
      from,
      to,
      team,
      employee,
      priority
    });

    await newChart.save();

    res.status(201).json({ success: true, message: "Project Organization Chart added successfully", data: newChart });
  } catch (error) {
    console.error("Error adding Project Organization Chart:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
