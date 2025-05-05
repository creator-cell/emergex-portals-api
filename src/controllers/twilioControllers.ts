import { Request, Response } from 'express';
import { twilioClient } from '../config/twilio';
import { ICustomRequest } from '../types/express';
import { logger } from '../config/logger';

export const generateTwilioTokenController = (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    // const token = generateTwilioToken(currentUser.id);
    return res.status(200).json({ success:true,token:"", message: 'Token generated successfully' });
  } catch (error) {
    logger.error('Error generating Twilio token:', error);
    return res.status(500).json({ success:false,error: 'Error generating token' });
  }
};

export const createVideoRoom = async (req: Request, res: Response) => {
  const { roomName } = req.body;

  try {
    const room = await twilioClient.video.rooms.create({
      uniqueName: roomName,
      type: 'group-small',
    });

    return res.status(200).json({ success:true,room });
  } catch (error) {
    logger.error('Error creating video room:', error);
    return res.status(500).json({ success:false,message: 'Error creating video room' });
  }
};

export const endVideoRoom = async (req: Request, res: Response) => {
  const { roomSid } = req.body;
  try {
    await twilioClient.video.rooms(roomSid).update({ status: 'completed' });
    return res.status(200).json({ success:true,message: 'Room ended successfully' });
  } catch (error) {
    logger.error('Error ending video room:', error);
    return res.status(500).json({ success:false,message: 'Error ending video room' });
  }
};