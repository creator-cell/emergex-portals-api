import IncidentModel from "../models/IncidentModel";

export async function generateUniqueIncidentId() {
    const prefix = 'INCID';
    const randomNumbers = Math.floor(100000 + Math.random() * 900000);
    const randomChars = Array.from({ length: 2 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join(''); 
  
    const id = `${prefix}-${randomNumbers}${randomChars}`;
    const isExist = await IncidentModel.findOne({
        id,
        });
    if (isExist) {
        generateUniqueIncidentId();
    }
    return id;
  }