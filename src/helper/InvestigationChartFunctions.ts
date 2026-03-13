import mongoose from "mongoose";
import InvestigationChartModel from "../models/InvestigationChartModel";

export async function updateDownstreamNodePriorities(projectId: string, employeeId: mongoose.Types.ObjectId, currentPriority: number) {
  if(employeeId===undefined) return;

  const downstreamRoles = await InvestigationChartModel.find({
    project: projectId,
    from: employeeId
  });
  
  if (!downstreamRoles || downstreamRoles.length === 0) {
    return;
  }
  
  for (const downstreamRole of downstreamRoles) {
    downstreamRole.priority = currentPriority + 1;

    await downstreamRole.save();
    
    await updateDownstreamNodePriorities(projectId, downstreamRole.to, downstreamRole.priority);
  }
}
