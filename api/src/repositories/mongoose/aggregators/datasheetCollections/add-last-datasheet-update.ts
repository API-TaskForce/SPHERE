import { PipelineStage } from 'mongoose';

export function addLastDatasheetUpdateAggregator(): PipelineStage[]{
  return [
    {
      $set: {
        lastUpdate: {
          $max: "$datasheets.datasheets.extractionDate"
        }
      }
    },
    {
      $set: {
        lastUpdate: {
          $max: "$lastUpdate"
        }
      }
    }
  ]
}
