import ProjectModel from "../models/ProjectModel";

export async function generateUniqueId() {
    const prefix = 'FIRMD';
    const randomNumbers = Math.floor(100000 + Math.random() * 900000);
    const randomChars = Array.from({ length: 2 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join(''); 
  
    const id = `${prefix}-${randomNumbers}${randomChars}`;
    const isExist = await ProjectModel.findOne({
        id,
        });
    if (isExist) {
        generateUniqueId();
    }
    return id;
  }