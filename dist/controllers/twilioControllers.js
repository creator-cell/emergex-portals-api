"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endVideoRoom = exports.createVideoRoom = exports.generateTwilioTokenController = void 0;
const twilio_1 = require("../config/twilio");
const logger_1 = require("../config/logger");
const generateTwilioTokenController = (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        // const token = generateTwilioToken(currentUser.id);
        return res.status(200).json({ success: true, token: "", message: 'Token generated successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error generating Twilio token:', error);
        return res.status(500).json({ success: false, error: 'Error generating token' });
    }
};
exports.generateTwilioTokenController = generateTwilioTokenController;
const createVideoRoom = async (req, res) => {
    const { roomName } = req.body;
    try {
        const room = await twilio_1.twilioClient.video.rooms.create({
            uniqueName: roomName,
            type: 'group-small',
        });
        return res.status(200).json({ success: true, room });
    }
    catch (error) {
        logger_1.logger.error('Error creating video room:', error);
        return res.status(500).json({ success: false, message: 'Error creating video room' });
    }
};
exports.createVideoRoom = createVideoRoom;
const endVideoRoom = async (req, res) => {
    const { roomSid } = req.body;
    try {
        await twilio_1.twilioClient.video.rooms(roomSid).update({ status: 'completed' });
        return res.status(200).json({ success: true, message: 'Room ended successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error ending video room:', error);
        return res.status(500).json({ success: false, message: 'Error ending video room' });
    }
};
exports.endVideoRoom = endVideoRoom;
