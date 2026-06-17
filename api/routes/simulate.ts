import { Router, Request, Response } from 'express';
import type { SimulationRequest, SimulationResponse } from '../../shared/types';
import { RayTracer } from '../services/RayTracer';
import {
  calculateReceiverResults,
  calculateAcousticParams,
  calculateSabineRT60,
  calculateRoomVolume,
  calculateWallArea,
} from '../services/Acoustics';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const request: SimulationRequest = req.body;

    if (!request.room || !request.room.walls || request.room.walls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room data',
      });
    }

    if (!request.sources || request.sources.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one source is required',
      });
    }

    if (!request.receivers || request.receivers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one receiver is required',
      });
    }

    const rayTracer = new RayTracer(
      request.room.walls,
      request.sources,
      request.receivers,
      request.params
    );

    const allRays = rayTracer.trace();

    const receiverResults = calculateReceiverResults(allRays);
    const acousticParams = calculateAcousticParams(allRays);

    const roomVolume = calculateRoomVolume(request.room.type, request.room.dimensions);
    const wallSurfaces = request.room.walls.map((wall) => ({
      area: calculateWallArea(wall),
      absorption: wall.material.absorption,
    }));
    const sabineRT60 = calculateSabineRT60(roomVolume, wallSurfaces);

    if (acousticParams.rt60 === 0 && sabineRT60 > 0) {
      acousticParams.rt60 = sabineRT60;
      acousticParams.rt30 = sabineRT60 * 0.5;
      acousticParams.t20 = sabineRT60 * (20 / 60);
    }

    const computeTime = Date.now() - startTime;

    const response: SimulationResponse = {
      success: true,
      results: receiverResults,
      acousticParams,
      stats: {
        totalRays: request.params.rayCount * request.sources.length,
        effectiveRays: allRays.length,
        computeTime,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Simulation error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    const computeTime = Date.now() - startTime;

    res.status(500).json({
      success: false,
      results: [],
      acousticParams: {
        rt60: 0,
        rt30: 0,
        c50: 0,
        d50: 0,
        t20: 0,
      },
      stats: {
        totalRays: 0,
        effectiveRays: 0,
        computeTime,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
