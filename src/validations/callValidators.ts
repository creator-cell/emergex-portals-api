import { param, query } from "express-validator";

export const initiateVideoCallValidator =[
    query("conversationId")
    .notEmpty()
    .withMessage("Please Provide Conversation ID")
    .isMongoId()
    .withMessage("Please Provide Valid MongoDB Id")
]

export const fetchCallByConversationValidator =[
    param("id")
    .notEmpty()
    .withMessage("Please Provide Conversation ID")
    .isMongoId()
    .withMessage("Please Provide Valid MongoDB Id")
]

export const handleCallEndValidation =[
    param("roomName")
    .isEmpty()
    .withMessage("Please provide room name")
    .isString()
    .withMessage("Room name must be string")
]

export const acceptIncomingCallValidation =[
    query("roomName")
    .isEmpty()
    .withMessage("Please provide room name")
    .isString()
    .withMessage("Room name must be string")
]