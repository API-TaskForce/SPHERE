export function getAllDatasheetsAggregator(filteringAggregators: any, sortAggregator: any) {
  return [
    { $sort: { extractionDate: -1 } },
    latestDatasheetsByNameAggregator,
    refactorRootAggregator,
    ...parseCollectionNameAggregator,
    ...filteringAggregators,
    refactorOutputAggregator,
    ...sortAggregator
  ];
}

const latestDatasheetsByNameAggregator = {
  $group: {
    _id: {
      name: '$name',
      owner: '$owner',
      _collectionId: '$_collectionId',
    },
    latestDatasheet: {
      $first: '$$ROOT',
    },
    latestExtractionDate: {
      $max: '$extractionDate',
    },
  },
};

const refactorRootAggregator = {
  $replaceRoot: {
    newRoot: '$latestDatasheet',
  },
};

const parseCollectionNameAggregator = [
  {
    $lookup: {
      from: 'datasheetCollections',
      localField: '_collectionId',
      foreignField: '_id',
      as: 'collection',
    },
  },
  {
    $unwind: {
      path: '$collection',
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $set: {
      collectionName: '$collection.name',
    },
  },
];

const refactorOutputAggregator = {
  $facet: {
    datasheets: [
      {
        $project: {
          _id: 0,
          name: 1,
          owner: 1,
          collectionName: 1,
          version: 1,
          extractionDate: 1,
          currency: 1,
          analytics: 1
        },
      },
      {
        $sort: { name: 1 },
      },
    ]
  }
};
