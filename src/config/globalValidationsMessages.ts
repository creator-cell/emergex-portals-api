export const authValidationMessages = {
    username:{
        empty:"Name must not empty.",
        length:"Name must have at least 4 characters long"
    },
    email:{
        empty:"Email must not be empty",
        notEmail:"Invalid email address",
    },
    password:{
        empty:"Password must not empty.",
        length:"Password must have at least 6 characters long"
    },
    role:{
        notFromEnum:"Invalid Role Value"
    }
} 

export const employeeValidationMessages = {
    id:{
        empty:"Employee ID is required.",
        invalidMongooseFormat:"Invalid Employee ID format!"
    },

    name:{
        empty:"Employee Name must not empty.",
        length:"Name must have at least 4 characters long"
    },
    contactNo:{
        empty:"Please Provide Employee Contact No.",
        length:"Employee Contact number must be 10 digits.",
        containCharacters:"Contact No. must contain only digits"
    },
    email:{
        empty:"Employee Email must not be empty",
        notEmail:"Invalid Employee email address",
    },
    designation:{
        empty:"Employee Designation must not empty.",
        length:"Designation must be at least 2 characters long."
    },
} 

export const teamValidationMessages = {
    id:{
        empty:"Team ID is required.",
        invalidMongooseFormat:"Invalid Team ID format!"
    },

    name:{
        empty:"Team Name must not empty.",
        length:"Team Name must have at least 4 characters long"
    },
} 