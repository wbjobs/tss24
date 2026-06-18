import { Router, Request, Response } from 'express';
import type { SoundFieldRequest, SoundFieldResponse } from '../../shared/types';
import { SoundFieldCalculator } from '../services/SoundField';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const request: SoundFieldRequest = req.body;

    if (!request.room || !request.room.walls || request.room.walls.length === 0) {
      return res.status(400).json({
        success: false,
        heatmaps: [],
        stats: { totalPoints: 0, totalRays: 0, computeTime: 0 },
        error: 'Invalid room data',
      });
    }

    if (!request.sources || request.sources.length === 0) {
      return res.status(400).json({
        success: false,
        heatmaps: [],
        stats: { totalPoints: 0, totalRays: 0, computeTime: 0 },
        error: 'At least one source is required',
      });
    }

    const gridResolution = request.gridResolution || 10;
    const targetSurfaces = request.targetSurfaces || ['floor'];

    const calculator = new SoundFieldCalculator(
      request.room.walls,
      request.sources,
      request.params,
      gridResolution
    );

    const heatmaps = calculator.calculate(targetSurfaces);

    const totalPoints = heatmaps.reduce((sum, h) => sum + h.points.length, 0);
    const totalRays = request.params.rayCount * request.sources.length;
    const computeTime = Date.now() - startTime;

    const response: SoundFieldResponse = {
      success: true,
      heatmaps,
      stats: {
        totalPoints,
        totalRays,
        computeTime,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Sound field error:', error);
    const computeTime = Date.now() - startTime;

    res.status(500).json({
      success: false,
      heatmaps: [],
      stats: {
        totalPoints: 0,
        totalRays: 0,
        computeTime,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
