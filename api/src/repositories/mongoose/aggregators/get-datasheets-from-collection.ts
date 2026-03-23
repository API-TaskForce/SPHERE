import { getAllDatasheetsAggregator } from "./get-all-datasheets";

export function getAllDatasheetsFromCollection() {
  return [lookupForDatasheetsAggregator];
}

const lookupForDatasheetsAggregator = {
  $lookup: {
    from: 'datasheets',
    localField: '_id',
    foreignField: '_collectionId',
    as: 'datasheets',
    pipeline: getAllDatasheetsAggregator([], []),
  },
};
