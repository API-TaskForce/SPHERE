import { getAllDatasheetsFromCollection } from '../get-datasheets-from-collection';

export function addNumberOfDatasheetsAggregator() {
  return [
    ...getAllDatasheetsFromCollection(),
    {
      $addFields: {
        datasheets: {
          $arrayElemAt: ['$datasheets', 0],
        },
      },
    },
    {
      $unwind: {
        path: '$datasheets',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        numberOfDatasheets: { $size: { $ifNull: ['$datasheets.datasheets', []] } },
      },
    },
  ];
}
