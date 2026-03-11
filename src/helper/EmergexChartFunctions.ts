import mongoose from "mongoose";
import EmergexChartModel from "../models/EmergexChartModel";

export async function updateDownstreamNodePriorities(projectId: string, employeeId: mongoose.Types.ObjectId, currentPriority: number) {
  // Find all roles that have this employee as their "from" connection

  if(employeeId===undefined) return;

  const downstreamRoles = await EmergexChartModel.find({
    project: projectId,
    from: employeeId
  });
  
  // If no downstream nodes, we're done with this branch
  if (!downstreamRoles || downstreamRoles.length === 0) {
    return;
  }
  
  // Process each downstream role
  for (const downstreamRole of downstreamRoles) {
    // Update priority of this downstream role
    downstreamRole.priority = currentPriority + 1;

    await downstreamRole.save();
    
    // Recursively update all nodes connected to this downstream role
    await updateDownstreamNodePriorities(projectId, downstreamRole.to, downstreamRole.priority);
  }
}
