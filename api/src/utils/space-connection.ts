import { connect, SpaceClient } from 'space-node-client';

const client: SpaceClient = connect({
  url: process.env.SPACE_URL || 'http://localhost:5403',
  apiKey: process.env.SPACE_API_KEY || ''
});

client.on('synchronized', (): void => {
  console.log('Connected and synchronized with SPACE!');
});